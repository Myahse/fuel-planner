package maps

import (
	"context"
	"fmt"
)

// MockProvider returns deterministic demo routes until a real map API is configured.
type MockProvider struct{}

func NewMockProvider() *MockProvider { return &MockProvider{} }

func (m *MockProvider) Geocode(ctx context.Context, query string) ([]Place, error) {
	switch normalize(query) {
	case "abidjan":
		return []Place{{Label: "Abidjan, Côte d'Ivoire", Lat: 5.36, Lng: -4.0083}}, nil
	case "yamoussoukro":
		return []Place{{Label: "Yamoussoukro, Côte d'Ivoire", Lat: 6.8276, Lng: -5.2893}}, nil
	default:
		return []Place{{Label: query, Lat: 5.36, Lng: -4.0083}}, nil
	}
}

func (m *MockProvider) ReverseGeocode(ctx context.Context, lat, lng float64) (*Place, error) {
	return &Place{Label: fmt.Sprintf("%.4f, %.4f", lat, lng), Lat: lat, Lng: lng}, nil
}

func (m *MockProvider) GetRoute(ctx context.Context, req RouteRequest) (*Route, error) {
	stops := append([]Place{req.Origin}, req.Waypoints...)
	stops = append(stops, req.Destination)
	oneWay := 0.0
	for i := 1; i < len(stops); i++ {
		oneWay += haversineKm(LatLng{Lat: stops[i-1].Lat, Lng: stops[i-1].Lng}, LatLng{Lat: stops[i].Lat, Lng: stops[i].Lng})
	}
	if oneWay <= 0 && normalize(req.Origin.Label) != normalize(req.Destination.Label) {
		// Fallback when coords collapse to the same demo point.
		oneWay = 245.0
	}
	return &Route{
		DistanceKm:         oneWay,
		DurationSeconds:    int(oneWay / 85 * 3600), // ~85 km/h average
		Polyline:           "",
		Provider:           "mock",
		OutboundDistanceKm: oneWay,
		ReturnDistanceKm:   oneWay,
	}, nil
}

func (m *MockProvider) GetNearbyStations(ctx context.Context, lat, lng float64, radiusKm float64) ([]Station, error) {
	return demoStations(), nil
}

func (m *MockProvider) GetStationsAlongRoute(ctx context.Context, route Route, maxDetourKm float64) ([]Station, error) {
	// No fake POIs through the API — use MAP_PROVIDER=mapbox for real stations.
	return nil, nil
}

func demoStations() []Station {
	return []Station{
		{ID: "1", Name: "Total Energies", Brand: "Total", Town: "N'Douci", Lat: 5.872, Lng: -4.765, DistanceFromKm: 95, PricePerLiter: 875, Currency: "FCFA", FuelType: "petrol"},
		{ID: "2", Name: "Oryx", Brand: "Oryx", Town: "Singrobo", Lat: 6.12, Lng: -4.93, DistanceFromKm: 150, PricePerLiter: 880, Currency: "FCFA", FuelType: "petrol"},
		{ID: "3", Name: "Petro Ivoire", Brand: "Petro Ivoire", Town: "Toumodi", Lat: 6.557, Lng: -5.019, DistanceFromKm: 190, PricePerLiter: 860, Currency: "FCFA", FuelType: "petrol"},
		{ID: "4", Name: "Vivo Energy", Brand: "Shell", Town: "Yamoussoukro", Lat: 6.81, Lng: -5.27, DistanceFromKm: 232, PricePerLiter: 870, Currency: "FCFA", FuelType: "petrol"},
	}
}

func normalize(s string) string {
	return stringsTrimLower(s)
}

func stringsTrimLower(s string) string {
	out := make([]byte, 0, len(s))
	for i := 0; i < len(s); i++ {
		c := s[i]
		if c >= 'A' && c <= 'Z' {
			c += 'a' - 'A'
		}
		if c != ' ' && c != ',' {
			out = append(out, c)
		}
	}
	// crude contains check for city names
	str := string(out)
	if contains(str, "abidjan") {
		return "abidjan"
	}
	if contains(str, "yamoussoukro") {
		return "yamoussoukro"
	}
	return str
}

func contains(haystack, needle string) bool {
	if len(needle) == 0 {
		return true
	}
	for i := 0; i+len(needle) <= len(haystack); i++ {
		if haystack[i:i+len(needle)] == needle {
			return true
		}
	}
	return false
}
