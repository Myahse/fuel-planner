package maps

import "strings"

func isFuelSearchboxPOI(featureType string, poiCategoryIDs []string, name string) bool {
	if isClearlyNotFuel(name) {
		return false
	}
	ft := strings.ToLower(strings.TrimSpace(featureType))
	if ft != "" && ft != "poi" && ft != "category" && ft != "brand" {
		return false
	}
	if len(poiCategoryIDs) > 0 {
		for _, id := range poiCategoryIDs {
			switch strings.ToLower(id) {
			case "gas_station", "fuel", "truck_stop", "service_station":
				return true
			}
		}
		// Mapbox sometimes tags fuel POIs with other category ids — keep name-based matches.
		return isLikelyFuelName(name)
	}
	// gas_station category search: trust unless clearly not fuel.
	return true
}

func isClearlyNotFuel(name string) bool {
	s := strings.ToLower(strings.TrimSpace(name))
	if s == "" {
		return true
	}
	for _, bad := range []string{
		"gare", "bus ", "autobus", "rail", "train", "métro", "metro", "aéroport", "airport",
		"parking", "hôtel", "hotel", "restaurant", "école", "school", "pharmac", "hospital",
		"clinic", "banque", "bank", "mosquée", "église",
	} {
		if strings.Contains(s, bad) {
			return true
		}
	}
	return false
}

func isLikelyFuelName(name string) bool {
	s := strings.ToLower(strings.TrimSpace(name))
	if s == "" || isClearlyNotFuel(name) {
		return false
	}
	for _, good := range []string{
		"total", "shell", "oryx", "esso", "petro", "vivo", "bp", "oilibya", "afrique",
		"gas", "fuel", "essence", "carburant", "station", "pétrole", "petrole", "lubrif",
	} {
		if strings.Contains(s, good) {
			return true
		}
	}
	return false
}

func isLikelyFuelGeocodeV5(name, placeName string) bool {
	return isLikelyFuelName(name + " " + placeName)
}

// Drop duplicate POIs within mergeMeters (keep the one closer to the route polyline when distances provided).
func dedupeStations(stations []Station, mergeMeters float64) []Station {
	if len(stations) < 2 {
		return stations
	}
	out := make([]Station, 0, len(stations))
	for _, st := range stations {
		dup := false
		for i, kept := range out {
			if haversineKm(LatLng{Lat: st.Lat, Lng: st.Lng}, LatLng{Lat: kept.Lat, Lng: kept.Lng})*1000 < mergeMeters {
				dup = true
				if st.Name != "" && len(st.Name) > len(kept.Name) {
					out[i] = st
				}
				break
			}
		}
		if !dup {
			out = append(out, st)
		}
	}
	return out
}
