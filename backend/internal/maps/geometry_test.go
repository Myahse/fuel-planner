package maps

import "testing"

func TestStationNearPolyline_rejectsFarOffRoute(t *testing.T) {
	route := []LatLng{
		{Lat: 5.0, Lng: -4.0},
		{Lat: 6.0, Lng: -5.0},
	}
	// Point on the segment midpoint (roughly on route).
	if !stationNearPolyline(route, 5.5, -4.5, 15) {
		t.Fatal("expected on-route point to pass")
	}
	// ~50 km east of corridor — should not count as on the road.
	if stationNearPolyline(route, 5.5, -3.2, 12) {
		t.Fatal("expected far point to be rejected")
	}
}

func TestSampleSearchRadiusKm_capped(t *testing.T) {
	if sampleSearchRadiusKm(30) != 10 {
		t.Fatalf("got %v", sampleSearchRadiusKm(30))
	}
	if sampleSearchRadiusKm(5) != 7 {
		t.Fatalf("got %v", sampleSearchRadiusKm(5))
	}
}
