package maps

// Tunables for Mapbox fuel POI search (env-backed via config.Load).
type StationSearchSettings struct {
	DefaultMaxDetourKm float64
	AlongRouteLimit    int
	NearbyRadiusKm     float64
	NearbyLimit        int
	SampleSearchLimit  int
}

// Upper bounds on search distances, from env or a request: anything wider means huge
// OpenStreetMap queries and stations no driver would detour to.
const (
	MaxDetourKmLimit       = 50.0
	MaxNearbyRadiusKmLimit = 50.0
)

// ClampKm keeps a requested distance within (0, max]; zero or negative means use fallback.
func ClampKm(v, fallback, max float64) float64 {
	if v <= 0 {
		v = fallback
	}
	if v > max {
		return max
	}
	return v
}

func (s StationSearchSettings) WithDefaults() StationSearchSettings {
	out := s
	out.DefaultMaxDetourKm = ClampKm(out.DefaultMaxDetourKm, 12, MaxDetourKmLimit)
	out.NearbyRadiusKm = ClampKm(out.NearbyRadiusKm, 30, MaxNearbyRadiusKmLimit)
	if out.AlongRouteLimit <= 0 {
		out.AlongRouteLimit = 25
	}
	if out.AlongRouteLimit > 50 {
		out.AlongRouteLimit = 50
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
