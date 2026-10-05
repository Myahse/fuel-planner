package maps

import "context"

// MapProvider abstracts routing/geocoding so the app is not tied to one vendor.
type MapProvider interface {
	Geocode(ctx context.Context, query string) ([]Place, error)
	ReverseGeocode(ctx context.Context, lat, lng float64) (*Place, error)
	GetRoute(ctx context.Context, req RouteRequest) (*Route, error)
	GetNearbyStations(ctx context.Context, lat, lng float64, radiusKm float64) ([]Station, error)
	GetStationsAlongRoute(ctx context.Context, route Route, maxDetourKm float64) ([]Station, error)
}

type Place struct {
	Label string
	Lat   float64
	Lng   float64
}

type RouteRequest struct {
	Origin      Place
	Destination Place
	Waypoints   []Place
	Profile     string // fastest, efficient, cheapest
}

type Route struct {
	DistanceKm          float64
	DurationSeconds     int
	Polyline            string
	Provider            string
	OutboundDistanceKm  float64
	ReturnDistanceKm    float64
}

type Station struct {
	ID             string
	Name           string
	Brand          string
	Lat            float64
	Lng            float64
	DistanceFromKm float64
	PricePerLiter  float64
	Currency       string
	FuelType       string
}
