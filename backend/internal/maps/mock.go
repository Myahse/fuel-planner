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
	// Demo: Abidjan ↔ Yamoussoukro one-way ≈ 245 km (round trip 490 km per product spec).
	oneWay := 245.0
	if normalize(req.Origin.Label) == normalize(req.Destination.Label) {
		oneWay = 0
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
	return []Station{
		{
			ID: "demo-total-tiebissou", Name: "Total Energies — Tiébissou", Brand: "Total",
			Lat: 7.16, Lng: -5.23, DistanceFromKm: 147, PricePerLiter: 875, Currency: "FCFA", FuelType: "petrol",
		},
	}, nil
}

func (m *MockProvider) GetStationsAlongRoute(ctx context.Context, route Route, maxDetourKm float64) ([]Station, error) {
	return m.GetNearbyStations(ctx, 0, 0, 50)
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
