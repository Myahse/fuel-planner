package vehicles

import (
	"encoding/json"
	"net/http"
	"regexp"
	"strings"

	"github.com/fuel-planner/backend/internal/httputil"
	"github.com/fuel-planner/backend/internal/middleware"
	"github.com/go-chi/chi/v5"
)

type Handler struct {
	repo *Repository
}

func NewHandler(repo *Repository) *Handler {
	return &Handler{repo: repo}
}

func (h *Handler) List(w http.ResponseWriter, r *http.Request) {
	userID, _ := middleware.UserIDFromContext(r.Context())
	list, err := h.repo.ListByUser(r.Context(), userID)
	if err != nil {
		httputil.Error(w, http.StatusInternalServerError, "could not list vehicles")
		return
	}
	httputil.JSON(w, http.StatusOK, map[string]interface{}{"vehicles": list})
}

func (h *Handler) Get(w http.ResponseWriter, r *http.Request) {
	userID, _ := middleware.UserIDFromContext(r.Context())
	id := chi.URLParam(r, "id")
	v, err := h.repo.GetByID(r.Context(), userID, id)
	if err != nil {
		httputil.Error(w, http.StatusNotFound, "vehicle not found")
		return
	}
	httputil.JSON(w, http.StatusOK, v)
}

func (h *Handler) Create(w http.ResponseWriter, r *http.Request) {
	userID, _ := middleware.UserIDFromContext(r.Context())
	var in CreateVehicleInput
	if err := json.NewDecoder(r.Body).Decode(&in); err != nil {
		httputil.Error(w, http.StatusBadRequest, "invalid JSON body")
		return
	}
	if err := validateCreate(in); err != nil {
		httputil.Error(w, http.StatusBadRequest, err.Error())
		return
	}
	in.FuelType = strings.ToLower(in.FuelType)
	v, err := h.repo.Create(r.Context(), userID, in)
	if err != nil {
		httputil.Error(w, http.StatusInternalServerError, "could not create vehicle")
		return
	}
	httputil.JSON(w, http.StatusCreated, v)
}

func (h *Handler) Update(w http.ResponseWriter, r *http.Request) {
	userID, _ := middleware.UserIDFromContext(r.Context())
	id := chi.URLParam(r, "id")
	var in UpdateVehicleInput
	if err := json.NewDecoder(r.Body).Decode(&in); err != nil {
		httputil.Error(w, http.StatusBadRequest, "invalid JSON body")
		return
	}
	if err := validateVisual(in.PaintColor, in.Model3DURL, in.BodyStyle); err != nil {
		httputil.Error(w, http.StatusBadRequest, err.Error())
		return
	}
	v, err := h.repo.Update(r.Context(), userID, id, in)
	if err != nil {
		httputil.Error(w, http.StatusNotFound, "vehicle not found")
		return
	}
	httputil.JSON(w, http.StatusOK, v)
}

func (h *Handler) Delete(w http.ResponseWriter, r *http.Request) {
	userID, _ := middleware.UserIDFromContext(r.Context())
	id := chi.URLParam(r, "id")
	if err := h.repo.Delete(r.Context(), userID, id); err != nil {
		httputil.Error(w, http.StatusNotFound, "vehicle not found")
		return
	}
	w.WriteHeader(http.StatusNoContent)
}

func (h *Handler) SetDefault(w http.ResponseWriter, r *http.Request) {
	userID, _ := middleware.UserIDFromContext(r.Context())
	id := chi.URLParam(r, "id")
	if err := h.repo.SetDefault(r.Context(), userID, id); err != nil {
		httputil.Error(w, http.StatusNotFound, "vehicle not found")
		return
	}
	v, err := h.repo.GetByID(r.Context(), userID, id)
	if err != nil {
		httputil.Error(w, http.StatusInternalServerError, "could not load vehicle")
		return
	}
	httputil.JSON(w, http.StatusOK, v)
}

func validateCreate(in CreateVehicleInput) error {
	if strings.TrimSpace(in.Make) == "" || strings.TrimSpace(in.Model) == "" {
		return errString("make and model are required")
	}
	if in.Year < 1900 || in.Year > 2100 {
		return errString("invalid year")
	}
	if in.TankCapacityLiters <= 0 {
		return errString("tank capacity must be positive")
	}
	if in.MixedConsumption <= 0 {
		return errString("mixed consumption must be positive")
	}
	ft := strings.ToLower(in.FuelType)
	if ft != "petrol" && ft != "diesel" && ft != "hybrid" {
		return errString("fuel_type must be petrol, diesel, or hybrid")
	}
	if in.InitialFuelPercent != nil && (*in.InitialFuelPercent < 0 || *in.InitialFuelPercent > 100) {
		return errString("initial fuel percentage must be 0-100")
	}
	return validateVisual(in.PaintColor, in.Model3DURL, in.BodyStyle)
}

var hexColor = regexp.MustCompile(`^#[0-9A-Fa-f]{6}$`)

func validateVisual(paint *string, modelURL *string, bodyStyle *string) error {
	if paint != nil && *paint != "" && !hexColor.MatchString(*paint) {
		return errString("paint_color must be a hex color like #166534")
	}
	if modelURL != nil && *modelURL != "" {
		u := strings.TrimSpace(*modelURL)
		if len(u) > 2048 {
			return errString("model_3d_url is too long")
		}
		if !strings.HasPrefix(u, "/") && !strings.HasPrefix(u, "https://") && !strings.HasPrefix(u, "http://") {
			return errString("model_3d_url must start with / or http(s)://")
		}
	}
	if bodyStyle != nil && *bodyStyle != "" {
		switch strings.ToLower(*bodyStyle) {
		case "sedan", "suv", "hatchback":
		default:
			return errString("body_style must be sedan, suv, or hatchback")
		}
	}
	return nil
}

type simpleError string

func (e simpleError) Error() string { return string(e) }

func errString(s string) error { return simpleError(s) }
