package fuel

import (
	"context"
	"encoding/json"
	"net/http"
	"strings"
	"time"

	"github.com/fuel-planner/backend/internal/httputil"
	"github.com/fuel-planner/backend/internal/middleware"
	"github.com/fuel-planner/backend/internal/vehicles"
	"github.com/fuel-planner/backend/pkg/fuelcalc"
	"github.com/jackc/pgx/v5/pgxpool"
)

type Handler struct {
	db       *pgxpool.Pool
	vehicles *vehicles.Repository
}

func NewHandler(db *pgxpool.Pool, vehicleRepo *vehicles.Repository) *Handler {
	return &Handler{db: db, vehicles: vehicleRepo}
}

type currentFuelResponse struct {
	VehicleID           string  `json:"vehicle_id"`
	FuelPercentage      float64 `json:"fuel_percentage"`
	TankCapacityLiters  float64 `json:"tank_capacity_liters"`
	EstimatedFuelLiters float64 `json:"estimated_fuel_liters"`
	EstimatedRangeKm    float64 `json:"estimated_range_km"`
	ConsumptionLPer100  float64 `json:"consumption_l_per_100km"`
	Disclaimer          string  `json:"disclaimer"`
}

type updateFuelRequest struct {
	VehicleID      string  `json:"vehicle_id"`
	FuelPercentage float64 `json:"fuel_percentage"`
}

type createTransactionRequest struct {
	VehicleID     string   `json:"vehicle_id"`
	StationID     *string  `json:"station_id"`
	Liters        *float64 `json:"liters"`
	Amount        *float64 `json:"amount"`
	PricePerLiter float64  `json:"price_per_liter"`
	FuelType      string   `json:"fuel_type"`
	Odometer      *float64 `json:"odometer"`
	Notes         string   `json:"notes"`
	CreatedAt     *string  `json:"created_at"`
}

type fuelTransaction struct {
	ID            string    `json:"id"`
	VehicleID     string    `json:"vehicle_id"`
	Liters        float64   `json:"liters"`
	PricePerLiter float64   `json:"price_per_liter"`
	TotalAmount   float64   `json:"total_amount"`
	FuelType      string    `json:"fuel_type"`
	Notes         string    `json:"notes"`
	CreatedAt     time.Time `json:"created_at"`
}

func (h *Handler) GetCurrent(w http.ResponseWriter, r *http.Request) {
	userID, _ := middleware.UserIDFromContext(r.Context())
	vehicleID := r.URL.Query().Get("vehicle_id")
	v, err := h.resolveVehicle(r.Context(), userID, vehicleID)
	if err != nil {
		httputil.Error(w, http.StatusNotFound, "vehicle not found")
		return
	}
	pct := 0.0
	if v.FuelPercentage != nil {
		pct = *v.FuelPercentage
	}
	est := fuelcalc.CalculateFuelFromPercentage(v.TankCapacityLiters, pct)
	httputil.JSON(w, http.StatusOK, currentFuelResponse{
		VehicleID:           v.ID,
		FuelPercentage:      pct,
		TankCapacityLiters:  v.TankCapacityLiters,
		EstimatedFuelLiters: est,
		EstimatedRangeKm:    fuelcalc.CalculateRange(est, v.MixedConsumption),
		ConsumptionLPer100:  v.MixedConsumption,
		Disclaimer:          "Estimated fuel based on your gauge reading. Fuel gauges are not perfectly linear.",
	})
}

func (h *Handler) PutCurrent(w http.ResponseWriter, r *http.Request) {
	userID, _ := middleware.UserIDFromContext(r.Context())
	var req updateFuelRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		httputil.Error(w, http.StatusBadRequest, "invalid JSON body")
		return
	}
	if req.FuelPercentage < 0 || req.FuelPercentage > 100 {
		httputil.Error(w, http.StatusBadRequest, "fuel_percentage must be between 0 and 100")
		return
	}
	v, err := h.resolveVehicle(r.Context(), userID, req.VehicleID)
	if err != nil {
		httputil.Error(w, http.StatusNotFound, "vehicle not found")
		return
	}

	_, err = h.db.Exec(r.Context(), `
		INSERT INTO fuel_levels (user_id, vehicle_id, fuel_percentage, updated_at)
		VALUES ($1, $2, $3, NOW())
		ON CONFLICT (vehicle_id) DO UPDATE SET fuel_percentage = EXCLUDED.fuel_percentage, updated_at = NOW()
	`, userID, v.ID, req.FuelPercentage)
	if err != nil {
		httputil.Error(w, http.StatusInternalServerError, "could not update fuel level")
		return
	}

	est := fuelcalc.CalculateFuelFromPercentage(v.TankCapacityLiters, req.FuelPercentage)
	httputil.JSON(w, http.StatusOK, currentFuelResponse{
		VehicleID:           v.ID,
		FuelPercentage:      req.FuelPercentage,
		TankCapacityLiters:  v.TankCapacityLiters,
		EstimatedFuelLiters: est,
		EstimatedRangeKm:    fuelcalc.CalculateRange(est, v.MixedConsumption),
		ConsumptionLPer100:  v.MixedConsumption,
		Disclaimer:          "Estimated fuel based on your gauge reading. Fuel gauges are not perfectly linear.",
	})
}

func (h *Handler) CreateTransaction(w http.ResponseWriter, r *http.Request) {
	userID, _ := middleware.UserIDFromContext(r.Context())
	var req createTransactionRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		httputil.Error(w, http.StatusBadRequest, "invalid JSON body")
		return
	}
	if req.PricePerLiter <= 0 {
		httputil.Error(w, http.StatusBadRequest, "price_per_liter must be positive")
		return
	}
	v, err := h.resolveVehicle(r.Context(), userID, req.VehicleID)
	if err != nil {
		httputil.Error(w, http.StatusNotFound, "vehicle not found")
		return
	}

	liters := 0.0
	total := 0.0
	if req.Liters != nil && req.Amount != nil {
		httputil.Error(w, http.StatusBadRequest, "provide liters or amount, not both")
		return
	}
	if req.Liters != nil {
		liters = *req.Liters
		total = liters * req.PricePerLiter
	} else if req.Amount != nil {
		total = *req.Amount
		liters = fuelcalc.CalculateLitersFromAmount(total, req.PricePerLiter)
	} else {
		httputil.Error(w, http.StatusBadRequest, "liters or amount required")
		return
	}
	if liters <= 0 {
		httputil.Error(w, http.StatusBadRequest, "invalid fuel amount")
		return
	}

	fuelType := strings.ToLower(req.FuelType)
	if fuelType == "" {
		fuelType = v.FuelType
	}

	createdAt := time.Now()
	if req.CreatedAt != nil {
		if t, err := time.Parse(time.RFC3339, *req.CreatedAt); err == nil {
			createdAt = t
		}
	}

	var tx fuelTransaction
	err = h.db.QueryRow(r.Context(), `
		INSERT INTO fuel_transactions (
			user_id, vehicle_id, station_id, liters, price_per_liter, total_amount, fuel_type, odometer, notes, created_at
		) VALUES ($1, $2, $3, $4, $5, $6, $7::fuel_type, $8, $9, $10)
		RETURNING id, vehicle_id, liters, price_per_liter, total_amount, fuel_type::text, notes, created_at
	`, userID, v.ID, req.StationID, liters, req.PricePerLiter, total, fuelType, req.Odometer, req.Notes, createdAt,
	).Scan(&tx.ID, &tx.VehicleID, &tx.Liters, &tx.PricePerLiter, &tx.TotalAmount, &tx.FuelType, &tx.Notes, &tx.CreatedAt)
	if err != nil {
		httputil.Error(w, http.StatusInternalServerError, "could not save transaction")
		return
	}

	// Update estimated fuel level after refill
	currentPct := 0.0
	if v.FuelPercentage != nil {
		currentPct = *v.FuelPercentage
	}
	currentLiters := fuelcalc.CalculateFuelFromPercentage(v.TankCapacityLiters, currentPct)
	newLiters := currentLiters + liters
	if newLiters > v.TankCapacityLiters {
		newLiters = v.TankCapacityLiters
	}
	newPct := fuelcalc.CalculatePercentage(newLiters, v.TankCapacityLiters)
	_, _ = h.db.Exec(r.Context(), `
		INSERT INTO fuel_levels (user_id, vehicle_id, fuel_percentage, updated_at)
		VALUES ($1, $2, $3, NOW())
		ON CONFLICT (vehicle_id) DO UPDATE SET fuel_percentage = EXCLUDED.fuel_percentage, updated_at = NOW()
	`, userID, v.ID, newPct)

	httputil.JSON(w, http.StatusCreated, tx)
}

func (h *Handler) ListTransactions(w http.ResponseWriter, r *http.Request) {
	userID, _ := middleware.UserIDFromContext(r.Context())
	vehicleID := r.URL.Query().Get("vehicle_id")
	query := `
		SELECT id, vehicle_id, liters, price_per_liter, total_amount, fuel_type::text, notes, created_at
		FROM fuel_transactions WHERE user_id = $1`
	args := []interface{}{userID}
	if vehicleID != "" {
		query += ` AND vehicle_id = $2`
		args = append(args, vehicleID)
	}
	query += ` ORDER BY created_at DESC LIMIT 100`

	rows, err := h.db.Query(r.Context(), query, args...)
	if err != nil {
		httputil.Error(w, http.StatusInternalServerError, "could not list transactions")
		return
	}
	defer rows.Close()

	var list []fuelTransaction
	for rows.Next() {
		var tx fuelTransaction
		if err := rows.Scan(&tx.ID, &tx.VehicleID, &tx.Liters, &tx.PricePerLiter, &tx.TotalAmount, &tx.FuelType, &tx.Notes, &tx.CreatedAt); err != nil {
			httputil.Error(w, http.StatusInternalServerError, "could not read transaction")
			return
		}
		list = append(list, tx)
	}
	httputil.JSON(w, http.StatusOK, map[string]interface{}{"transactions": list})
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
