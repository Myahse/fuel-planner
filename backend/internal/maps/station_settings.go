package maps

// Tunables for Mapbox fuel POI search (env-backed via config.Load).
type StationSearchSettings struct {
	DefaultMaxDetourKm float64
	AlongRouteLimit    int
	NearbyRadiusKm     float64
	NearbyLimit        int
	SampleSearchLimit  int
}

func (s StationSearchSettings) WithDefaults() StationSearchSettings {
	out := s
	if out.DefaultMaxDetourKm <= 0 {
		out.DefaultMaxDetourKm = 12
	}
	if out.AlongRouteLimit <= 0 {
		out.AlongRouteLimit = 25
	}
	if out.AlongRouteLimit > 50 {
		out.AlongRouteLimit = 50
	}
	if out.NearbyRadiusKm <= 0 {
		out.NearbyRadiusKm = 30
	}
	if out.NearbyLimit <= 0 {
		out.NearbyLimit = 40
	}
	if out.NearbyLimit > 50 {
		out.NearbyLimit = 50
	}
	if out.SampleSearchLimit <= 0 {
		out.SampleSearchLimit = 25
	}
	if out.SampleSearchLimit > 50 {
		out.SampleSearchLimit = 50
	}
	return out
}
