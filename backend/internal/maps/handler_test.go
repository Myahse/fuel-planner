package maps

import (
	"context"
	"net/http"
	"net/http/httptest"
	"strings"
	"testing"
)

// recordingProvider captures the distances the handler passes on.
type recordingProvider struct {
	MapProvider
	detour, radius float64
}

func (p *recordingProvider) GetStationsAlongRoute(_ context.Context, _ Route, maxDetourKm float64) ([]Station, error) {
	p.detour = maxDetourKm
	return nil, nil
}

func (p *recordingProvider) GetNearbyStations(_ context.Context, _, _ float64, radiusKm float64) ([]Station, error) {
	p.radius = radiusKm
	return nil, nil
}

func TestHandlerClampsSearchDistances(t *testing.T) {
	p := &recordingProvider{}
	h := NewHandler(p, StationSearchSettings{})

	body := strings.NewReader(`{"route_polyline":"abc","distance_km":200,"max_detour_km":5000}`)
	h.StationsAlongRoute(httptest.NewRecorder(), httptest.NewRequest(http.MethodPost, "/", body))
	if p.detour != MaxDetourKmLimit {
		t.Fatalf("detour = %v, want %v", p.detour, MaxDetourKmLimit)
	}

	h.StationsNearby(httptest.NewRecorder(), httptest.NewRequest(http.MethodGet, "/?lat=5.36&lng=-4.0&radius_km=5000", nil))
	if p.radius != MaxNearbyRadiusKmLimit {
		t.Fatalf("radius = %v, want %v", p.radius, MaxNearbyRadiusKmLimit)
	}

	rec := httptest.NewRecorder()
	h.StationsNearby(rec, httptest.NewRequest(http.MethodGet, "/?lat=500&lng=-4.0", nil))
	if rec.Code != http.StatusBadRequest {
		t.Fatalf("out-of-range lat: status %d, want 400", rec.Code)
	}
}
