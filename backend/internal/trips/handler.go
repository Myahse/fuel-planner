package trips

import (
	"context"
	"encoding/json"
	"net/http"
	"strings"

	"github.com/fuel-planner/backend/internal/httputil"
	"github.com/fuel-planner/backend/internal/maps"
	"github.com/fuel-planner/backend/internal/middleware"
	"github.com/fuel-planner/backend/internal/vehicles"
	"github.com/fuel-planner/backend/pkg/fuelcalc"
	"github.com/go-chi/chi/v5"
	"github.com/jackc/pgx/v5/pgxpool"
)

type Handler struct {
	db       *pgxpool.Pool
	vehicles *vehicles.Repository
	repo     *Repository
	maps     maps.MapProvider
}

func NewHandler(db *pgxpool.Pool, vehicleRepo *vehicles.Repository, mapProvider maps.MapProvider) *Handler {
	return &Handler{db: db, vehicles: vehicleRepo, repo: NewRepository(db), maps: mapProvider}
}

type tripRequest struct {
	VehicleID          string  `json:"vehicle_id"`
	Origin             string  `json:"origin"`
	Destination        string  `json:"destination"`
	TripType           string  `json:"trip_type"`
	ConsumptionProfile string  `json:"consumption_profile"`
	FuelPricePerLiter  float64 `json:"fuel_price_per_liter"`
}

type calculateResponse struct {
	Origin                   string                      `json:"origin"`
	Destination              string                      `json:"destination"`
	TripType                 string                      `json:"trip_type"`
	DistanceKm               float64                     `json:"distance_km"`
	EstimatedDurationSeconds int                         `json:"estimated_duration_seconds"`
	FuelRequiredLiters       float64                     `json:"fuel_required_liters"`
	EstimatedFuelCost        float64                     `json:"estimated_fuel_cost"`
	StartingFuelLitersEst    float64                     `json:"starting_fuel_liters_est"`
	Assessment               fuelcalc.TripFuelAssessment `json:"assessment"`
	MapProvider              string                      `json:"map_provider"`
	Disclaimer               string                      `json:"disclaimer"`
}

func (h *Handler) Calculate(w http.ResponseWriter, r *http.Request) {
	comp, err := h.computeFromRequest(r)
	if err != nil {
		writeTripError(w, err)
		return
	}
	httputil.JSON(w, http.StatusOK, toCalculateResponse(comp))
}

func (h *Handler) Create(w http.ResponseWriter, r *http.Request) {
	userID, _ := middleware.UserIDFromContext(r.Context())
	comp, v, profile, err := h.computeFromRequestWithVehicle(r)
	if err != nil {
		writeTripError(w, err)
		return
	}
	trip, err := h.repo.Create(r.Context(), userID, v.ID, comp, profile)
	if err != nil {
		httputil.Error(w, http.StatusInternalServerError, "could not save trip")
		return
	}
	httputil.JSON(w, http.StatusCreated, map[string]interface{}{
		"trip":       trip,
		"assessment": comp.Assessment,
	})
}

func (h *Handler) List(w http.ResponseWriter, r *http.Request) {
	userID, _ := middleware.UserIDFromContext(r.Context())
	list, err := h.repo.ListByUser(r.Context(), userID, 50)
	if err != nil {
		httputil.Error(w, http.StatusInternalServerError, "could not list trips")
		return
	}
	httputil.JSON(w, http.StatusOK, map[string]interface{}{"trips": list})
}

func (h *Handler) Get(w http.ResponseWriter, r *http.Request) {
	userID, _ := middleware.UserIDFromContext(r.Context())
	id := chi.URLParam(r, "id")
	trip, err := h.repo.GetByID(r.Context(), userID, id)
	if err != nil {
		httputil.Error(w, http.StatusNotFound, "trip not found")
		return
	}
	httputil.JSON(w, http.StatusOK, trip)
}

func (h *Handler) Start(w http.ResponseWriter, r *http.Request) {
	userID, _ := middleware.UserIDFromContext(r.Context())
	id := chi.URLParam(r, "id")
	trip, err := h.repo.Start(r.Context(), userID, id)
	if err != nil {
		httputil.Error(w, http.StatusBadRequest, "trip cannot be started")
		return
	}
	httputil.JSON(w, http.StatusOK, trip)
}

type endTripRequest struct {
	EndingFuelLitersEst *float64 `json:"ending_fuel_liters_est"`
}

func (h *Handler) End(w http.ResponseWriter, r *http.Request) {
	userID, _ := middleware.UserIDFromContext(r.Context())
	id := chi.URLParam(r, "id")

	trip, err := h.repo.GetByID(r.Context(), userID, id)
	if err != nil {
		httputil.Error(w, http.StatusNotFound, "trip not found")
		return
	}

	var req endTripRequest
	_ = json.NewDecoder(r.Body).Decode(&req)

	ending := trip.StartingFuelLitersEst - trip.FuelRequiredLiters
	if ending < 0 {
		ending = 0
	}
	if req.EndingFuelLitersEst != nil {
		ending = *req.EndingFuelLitersEst
	}

	completed, err := h.repo.End(r.Context(), userID, id, ending)
	if err != nil {
		httputil.Error(w, http.StatusBadRequest, "trip cannot be ended")
		return
	}

	v, err := h.vehicles.GetByID(r.Context(), userID, trip.VehicleID)
	if err == nil {
		newPct := fuelcalc.CalculatePercentage(ending, v.TankCapacityLiters)
		_, _ = h.db.Exec(r.Context(), `
			INSERT INTO fuel_levels (user_id, vehicle_id, fuel_percentage, updated_at)
			VALUES ($1, $2, $3, NOW())
			ON CONFLICT (vehicle_id) DO UPDATE SET fuel_percentage = EXCLUDED.fuel_percentage, updated_at = NOW()
		`, userID, trip.VehicleID, newPct)
	}

	httputil.JSON(w, http.StatusOK, completed)
}

func (h *Handler) computeFromRequest(r *http.Request) (*TripComputation, error) {
	comp, _, _, err := h.computeFromRequestWithVehicle(r)
	return comp, err
}

func (h *Handler) computeFromRequestWithVehicle(r *http.Request) (*TripComputation, *vehicles.Vehicle, string, error) {
	userID, _ := middleware.UserIDFromContext(r.Context())
	var req tripRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		return nil, nil, "", errBadRequest("invalid JSON body")
	}
	if strings.TrimSpace(req.Origin) == "" || strings.TrimSpace(req.Destination) == "" {
		return nil, nil, "", errBadRequest("origin and destination are required")
	}

	v, err := h.resolveVehicle(r.Context(), userID, req.VehicleID)
	if err != nil {
		return nil, nil, "", errNotFound("vehicle not found")
	}

	profile := strings.ToLower(req.ConsumptionProfile)
	if profile == "" {
		profile = "mixed"
	}

	comp, err := ComputeTrip(r.Context(), h.maps, v, TripInput{
		VehicleID:          req.VehicleID,
		Origin:             req.Origin,
		Destination:        req.Destination,
		TripType:           req.TripType,
		ConsumptionProfile: profile,
		FuelPricePerLiter:  req.FuelPricePerLiter,
	})
	if err != nil {
		return nil, nil, "", err
	}
	return comp, v, profile, nil
}

func toCalculateResponse(comp *TripComputation) calculateResponse {
	return calculateResponse{
		Origin:                   comp.OriginLabel,
		Destination:              comp.DestinationLabel,
		TripType:                 comp.TripType,
		DistanceKm:               comp.DistanceKm,
		EstimatedDurationSeconds: comp.EstimatedDurationSeconds,
		FuelRequiredLiters:       comp.FuelRequiredLiters,
		EstimatedFuelCost:        comp.EstimatedFuelCost,
		StartingFuelLitersEst:    comp.StartingFuelLitersEst,
		Assessment:               comp.Assessment,
		MapProvider:              comp.MapProvider,
		Disclaimer:               "Fuel and range figures are estimates based on your gauge and consumption profile.",
	}
}

func writeTripError(w http.ResponseWriter, err error) {
	switch {
	case isBadRequest(err):
		httputil.Error(w, http.StatusBadRequest, err.Error())
	case isNotFound(err):
		httputil.Error(w, http.StatusNotFound, err.Error())
	default:
		if err == errGeocodeOrigin || err == errGeocodeDestination {
			httputil.Error(w, http.StatusBadRequest, err.Error())
			return
		}
		httputil.Error(w, http.StatusBadGateway, "could not calculate route")
	}
}

type badReqErr string

func (e badReqErr) Error() string { return string(e) }

func errBadRequest(msg string) error { return badReqErr(msg) }

func isBadRequest(err error) bool {
	_, ok := err.(badReqErr)
	return ok
}

type notFoundErr string

func (e notFoundErr) Error() string { return string(e) }

func errNotFound(msg string) error { return notFoundErr(msg) }

func isNotFound(err error) bool {
	_, ok := err.(notFoundErr)
	return ok
}

func (h *Handler) resolveVehicle(ctx context.Context, userID, vehicleID string) (*vehicles.Vehicle, error) {
	if vehicleID == "" {
		list, err := h.vehicles.ListByUser(ctx, userID)
		if err != nil || len(list) == 0 {
			return nil, err
		}
		for _, v := range list {
			if v.IsDefault {
				return &v, nil
			}
		}
		return &list[0], nil
	}
	return h.vehicles.GetByID(ctx, userID, vehicleID)
}
