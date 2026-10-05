package maps

import "math"

const earthRadiusKm = 6371.0

func haversineKm(a, b LatLng) float64 {
	dLat := (b.Lat - a.Lat) * math.Pi / 180
	dLng := (b.Lng - a.Lng) * math.Pi / 180
	lat1 := a.Lat * math.Pi / 180
	lat2 := b.Lat * math.Pi / 180
	h := math.Sin(dLat/2)*math.Sin(dLat/2) +
		math.Cos(lat1)*math.Cos(lat2)*math.Sin(dLng/2)*math.Sin(dLng/2)
	return 2 * earthRadiusKm * math.Asin(math.Min(1, math.Sqrt(h)))
}

type projection struct {
	lat            float64
	lng            float64
	distanceAlong  float64
	distanceOffKm  float64
}

func nearestOnPolyline(route []LatLng, point LatLng) *projection {
	if len(route) < 2 {
		return nil
	}
	var best *projection
	along := 0.0
	for i := 1; i < len(route); i++ {
		a, b := route[i-1], route[i]
		segLen := haversineKm(a, b)
		proj := projectOnSegment(a, b, point)
		off := haversineKm(point, LatLng{Lat: proj.lat, Lng: proj.lng})
		at := along + segLen*proj.t
		if best == nil || off < best.distanceOffKm {
			best = &projection{lat: proj.lat, lng: proj.lng, distanceAlong: at, distanceOffKm: off}
		}
		along += segLen
	}
	return best
}

func projectOnSegment(a, b, p LatLng) struct {
	lat, lng float64
	t        float64
} {
	ax, ay := a.Lng, a.Lat
	bx, by := b.Lng, b.Lat
	px, py := p.Lng, p.Lat
	dx := bx - ax
	dy := by - ay
	len2 := dx*dx + dy*dy
	t := 0.0
	if len2 != 0 {
		t = ((px-ax)*dx + (py-ay)*dy) / len2
		if t < 0 {
			t = 0
		} else if t > 1 {
			t = 1
		}
	}
	return struct {
		lat, lng float64
		t        float64
	}{lat: ay + t*dy, lng: ax + t*dx, t: t}
}

// samplePolyline returns up to maxPoints positions evenly spaced along the path (including ends).
func samplePolyline(route []LatLng, maxPoints int) []LatLng {
	if len(route) == 0 {
		return nil
	}
	if len(route) == 1 || maxPoints <= 1 {
		return []LatLng{route[0]}
	}
	var segLens []float64
	total := 0.0
	for i := 1; i < len(route); i++ {
		l := haversineKm(route[i-1], route[i])
		segLens = append(segLens, l)
		total += l
	}
	if total == 0 {
		return []LatLng{route[0]}
	}
	out := make([]LatLng, 0, maxPoints)
	for i := 0; i < maxPoints; i++ {
		target := total * float64(i) / float64(maxPoints-1)
		out = append(out, pointAtDistance(route, segLens, target))
	}
	return out
}

func pointAtDistance(route []LatLng, segLens []float64, targetKm float64) LatLng {
	walk := 0.0
	for i, l := range segLens {
		if walk+l >= targetKm {
			if l == 0 {
				return route[i]
			}
			t := (targetKm - walk) / l
			a, b := route[i], route[i+1]
			return LatLng{
				Lat: a.Lat + t*(b.Lat-a.Lat),
				Lng: a.Lng + t*(b.Lng-a.Lng),
			}
		}
		walk += l
	}
	return route[len(route)-1]
}

func polylineLengthKm(route []LatLng) float64 {
	var km float64
	for i := 1; i < len(route); i++ {
		km += haversineKm(route[i-1], route[i])
	}
	return km
}

func stationNearPolyline(route []LatLng, lat, lng, maxOffKm float64) bool {
	if len(route) < 2 || maxOffKm <= 0 {
		return false
	}
	proj := nearestOnPolyline(route, LatLng{Lat: lat, Lng: lng})
	return proj != nil && proj.distanceOffKm <= maxOffKm
}

func sampleSearchRadiusKm(maxDetourKm float64) float64 {
	// Search disk around each sample point — keep close to the corridor, not whole cities.
	r := maxDetourKm + 2
	if r > 10 {
		r = 10
	}
	if r < 5 {
		r = 5
	}
	return r
}

func attachStationsToRoute(candidates []Station, route []LatLng, tripDistanceKm, maxDetourKm float64) []Station {
	if len(route) < 2 || tripDistanceKm <= 0 {
		return nil
	}
	polyKm := polylineLengthKm(route)
	scale := 1.0
	if polyKm > 0 {
		scale = tripDistanceKm / polyKm
	}
	seen := make(map[string]bool)
	out := make([]Station, 0, len(candidates))
	for _, st := range candidates {
		if st.ID != "" && seen[st.ID] {
			continue
		}
		proj := nearestOnPolyline(route, LatLng{Lat: st.Lat, Lng: st.Lng})
		if proj == nil || proj.distanceOffKm > maxDetourKm {
			continue
		}
		km := math.Round(proj.distanceAlong * scale)
		if km <= 0 || km > tripDistanceKm {
			continue
		}
		// Snap is only for km-along-route; keep Lat/Lng at the real pump (set by Mapbox).
		st.RouteLat = proj.lat
		st.RouteLng = proj.lng
		st.DistanceFromKm = km
		if st.ID != "" {
			seen[st.ID] = true
		}
		out = append(out, st)
	}
	sortStationsByDistance(out)
	return out
}

// When strict detour filtering removes every POI, still return nearest stops on the route (up to maxOffKm).
func attachStationsLoose(candidates []Station, route []LatLng, tripDistanceKm float64, maxOffKm float64) []Station {
	if len(route) < 2 || tripDistanceKm <= 0 || len(candidates) == 0 {
		return nil
	}
	polyKm := polylineLengthKm(route)
	scale := 1.0
	if polyKm > 0 {
		scale = tripDistanceKm / polyKm
	}
	seen := make(map[string]bool)
	out := make([]Station, 0, len(candidates))
	for _, st := range candidates {
		if st.ID != "" && seen[st.ID] {
			continue
		}
		proj := nearestOnPolyline(route, LatLng{Lat: st.Lat, Lng: st.Lng})
		if proj == nil || proj.distanceOffKm > maxOffKm {
			continue
		}
		km := math.Round(proj.distanceAlong * scale)
		if km < 0 {
			km = 0
		}
		if km > tripDistanceKm {
			km = math.Round(tripDistanceKm)
		}
		st.RouteLat = proj.lat
		st.RouteLng = proj.lng
		st.DistanceFromKm = km
		if st.ID != "" {
			seen[st.ID] = true
		}
		out = append(out, st)
	}
	sortStationsByDistance(out)
	if len(out) > 50 {
		out = out[:50]
	}
	return out
}

func sortStationsByDistance(st []Station) {
	for i := 0; i < len(st); i++ {
		for j := i + 1; j < len(st); j++ {
			if st[j].DistanceFromKm < st[i].DistanceFromKm {
				st[i], st[j] = st[j], st[i]
			}
		}
	}
}
