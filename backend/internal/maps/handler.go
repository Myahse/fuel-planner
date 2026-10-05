package maps

import (
	"encoding/json"
	"net/http"
	"strconv"

	"github.com/fuel-planner/backend/internal/httputil"
)

type Handler struct {
	provider MapProvider
	stations StationSearchSettings
}

func NewHandler(provider MapProvider, stations StationSearchSettings) *Handler {
	return &Handler{provider: provider, stations: stations.WithDefaults()}
}

type alongRouteRequest struct {
	RoutePolyline string  `json:"route_polyline"`
	DistanceKm    float64 `json:"distance_km"`
	MaxDetourKm   float64 `json:"max_detour_km"`
}

type stationsResponse struct {
	Stations    []stationJSON `json:"stations"`
	MapProvider string        `json:"map_provider"`
	Disclaimer  string        `json:"disclaimer"`
}

type stationJSON struct {
	ID                  string  `json:"id"`
	Name                string  `json:"name"`
	Brand               string  `json:"brand"`
	Town                string  `json:"town"`
	Lat                 float64 `json:"lat"`
	Lng                 float64 `json:"lng"`
	RouteLat            float64 `json:"route_lat"`
	RouteLng            float64 `json:"route_lng"`
	DistanceKmFromStart float64 `json:"distance_km_from_start"`
	PricePerLiter       float64 `json:"price_per_liter"`
	Currency            string  `json:"currency"`
	FuelType            string  `json:"fuel_type"`
}

func (h *Handler) StationsAlongRoute(w http.ResponseWriter, r *http.Request) {
	var req alongRouteRequest
	// A polyline6 for a long cross-country route is well under 1 MB.
	r.Body = http.MaxBytesReader(w, r.Body, 1<<20)
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		httputil.Error(w, http.StatusBadRequest, "invalid JSON body")
		return
	}
	if req.RoutePolyline == "" || req.DistanceKm <= 0 {
		httputil.Error(w, http.StatusBadRequest, "route_polyline and distance_km are required")
		return
	}
	maxDetour := ClampKm(req.MaxDetourKm, h.stations.DefaultMaxDetourKm, MaxDetourKmLimit)
	stations, err := h.provider.GetStationsAlongRoute(r.Context(), Route{
		Polyline:   req.RoutePolyline,
		DistanceKm: req.DistanceKm,
	}, maxDetour)
	if err != nil {
		httputil.Error(w, http.StatusBadGateway, "could not load fuel stations")
		return
	}
	disclaimer := "Fuel stations from Mapbox and OpenStreetMap where available. Prices are not provided — use your own pump price for cost estimates."
	if len(stations) == 0 && providerName(h.provider) == "mapbox" {
		disclaimer += " No POIs returned — check connectivity to Mapbox and OpenStreetMap (Overpass)."
	}
	httputil.JSON(w, http.StatusOK, stationsResponse{
		Stations:    toStationJSON(stations),
		MapProvider: providerName(h.provider),
		Disclaimer:  disclaimer,
	})
}

func (h *Handler) StationsNearby(w http.ResponseWriter, r *http.Request) {
	lat, err1 := strconv.ParseFloat(r.URL.Query().Get("lat"), 64)
	lng, err2 := strconv.ParseFloat(r.URL.Query().Get("lng"), 64)
	if err1 != nil || err2 != nil || lat < -90 || lat > 90 || lng < -180 || lng > 180 {
		httputil.Error(w, http.StatusBadRequest, "lat and lng query parameters are required and must be valid coordinates")
		return
	}
	radius := h.stations.NearbyRadiusKm
	if v := r.URL.Query().Get("radius_km"); v != "" {
		if parsed, err := strconv.ParseFloat(v, 64); err == nil && parsed > 0 {
			radius = ClampKm(parsed, radius, MaxNearbyRadiusKmLimit)
		}
	}
	stations, err := h.provider.GetNearbyStations(r.Context(), lat, lng, radius)
	if err != nil {
		httputil.Error(w, http.StatusBadGateway, "could not load fuel stations")
		return
	}
	httputil.JSON(w, http.StatusOK, stationsResponse{
		Stations:    toStationJSON(stations),
		MapProvider: providerName(h.provider),
		Disclaimer:  "Fuel stations from Mapbox and OpenStreetMap where available. Prices are not provided.",
	})
}

func toStationJSON(stations []Station) []stationJSON {
	out := make([]stationJSON, 0, len(stations))
	for _, s := range stations {
		rLat, rLng := s.RouteLat, s.RouteLng
		if rLat == 0 && rLng == 0 {
			rLat, rLng = s.Lat, s.Lng
		}
		out = append(out, stationJSON{
			ID:                  s.ID,
			Name:                s.Name,
			Brand:               s.Brand,
			Town:                s.Town,
			Lat:                 s.Lat,
			Lng:                 s.Lng,
			RouteLat:            rLat,
			RouteLng:            rLng,
			DistanceKmFromStart: s.DistanceFromKm,
			PricePerLiter:       s.PricePerLiter,
			Currency:            s.Currency,
			FuelType:            s.FuelType,
		})
	}
	return out
}

func providerName(p MapProvider) string {
	if _, ok := p.(*MapboxProvider); ok {
		return "mapbox"
	}
	return "mock"
}
