package maps

import (
	"context"
	"net/http"
	"net/http/httptest"
	"strings"
	"testing"
)

func newTestMapbox(t *testing.T, handler http.HandlerFunc) *MapboxProvider {
	t.Helper()
	srv := httptest.NewServer(handler)
	t.Cleanup(srv.Close)
	return NewMapboxProvider("pk.test", "ci").WithBaseURL(srv.URL)
}

func TestMapboxGeocode(t *testing.T) {
	p := newTestMapbox(t, func(w http.ResponseWriter, r *http.Request) {
		if r.URL.Path != "/search/geocode/v6/forward" {
			t.Errorf("path = %s", r.URL.Path)
		}
		if got := r.URL.Query().Get("country"); got != "ci" {
			t.Errorf("country = %q", got)
		}
		_, _ = w.Write([]byte(`{"features":[{"geometry":{"coordinates":[-5.2893,6.8276]},"properties":{"full_address":"Yamoussoukro, Côte d'Ivoire"}}]}`))
	})
	places, err := p.Geocode(context.Background(), "Yamoussoukro")
	if err != nil {
		t.Fatal(err)
	}
	if places[0].Lat != 6.8276 || places[0].Lng != -5.2893 || places[0].Label != "Yamoussoukro, Côte d'Ivoire" {
		t.Fatalf("got %+v", places[0])
	}
}

func TestMapboxGeocodePassesCoordinatesThrough(t *testing.T) {
	p := newTestMapbox(t, func(w http.ResponseWriter, r *http.Request) {
		t.Error("coordinates must not trigger an API call")
	})
	places, err := p.Geocode(context.Background(), "5.36, -4.0083")
	if err != nil || places[0].Lat != 5.36 || places[0].Lng != -4.0083 {
		t.Fatalf("got %+v, %v", places, err)
	}
}

func TestMapboxGeocodeNoResults(t *testing.T) {
	p := newTestMapbox(t, func(w http.ResponseWriter, r *http.Request) {
		_, _ = w.Write([]byte(`{"features":[]}`))
	})
	if _, err := p.Geocode(context.Background(), "nowhere"); err != ErrNoResults {
		t.Fatalf("err = %v", err)
	}
}

func TestMapboxRoute(t *testing.T) {
	p := newTestMapbox(t, func(w http.ResponseWriter, r *http.Request) {
		if !strings.HasPrefix(r.URL.Path, "/directions/v5/mapbox/driving-traffic/-4.008300,5.360000;-5.289300,6.827600") {
			t.Errorf("path = %s", r.URL.Path)
		}
		_, _ = w.Write([]byte(`{"code":"Ok","routes":[{"distance":238400,"duration":10260,"geometry":"abc"}]}`))
	})
	route, err := p.GetRoute(context.Background(), RouteRequest{
		Origin:      Place{Lat: 5.36, Lng: -4.0083},
		Destination: Place{Lat: 6.8276, Lng: -5.2893},
	})
	if err != nil {
		t.Fatal(err)
	}
	if route.DistanceKm != 238.4 || route.DurationSeconds != 10260 || route.Polyline != "abc" || route.Provider != "mapbox" {
		t.Fatalf("got %+v", route)
	}
}

func TestMapboxErrorDoesNotLeakToken(t *testing.T) {
	p := newTestMapbox(t, func(w http.ResponseWriter, r *http.Request) {
		w.WriteHeader(http.StatusUnauthorized)
	})
	_, err := p.Geocode(context.Background(), "Abidjan")
	if err == nil || strings.Contains(err.Error(), "pk.test") {
		t.Fatalf("err = %v", err)
	}
}
