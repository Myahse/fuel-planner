package maps

import (
	"context"
	"encoding/json"
	"fmt"
	"io"
	"math"
	"net/http"
	"net/url"
	"strings"
	"sync"
)

type searchboxCategoryResponse struct {
	Features []searchboxFeature `json:"features"`
}

type searchboxFeature struct {
	Geometry struct {
		Coordinates []float64 `json:"coordinates"`
	} `json:"geometry"`
	Properties struct {
		Name          string   `json:"name"`
		NamePreferred string   `json:"name_preferred"`
		MapboxID      string   `json:"mapbox_id"`
		FeatureType   string   `json:"feature_type"`
		PoiCategoryIDs []string `json:"poi_category_ids"`
		Maki          string   `json:"maki"`
		FullAddress   string   `json:"full_address"`
		Place         string   `json:"place_formatted"`
		Context       struct {
			Place *struct {
				Name string `json:"name"`
			} `json:"place"`
			Locality *struct {
				Name string `json:"name"`
			} `json:"locality"`
		} `json:"context"`
		Coordinates struct {
			Latitude  float64 `json:"latitude"`
			Longitude float64 `json:"longitude"`
			Routable  []struct {
				Name      string  `json:"name"`
				Latitude  float64 `json:"latitude"`
				Longitude float64 `json:"longitude"`
			} `json:"routable_points"`
		} `json:"coordinates"`
	} `json:"properties"`
}

type geocodeV5Response struct {
	Features []struct {
		ID        string    `json:"id"`
		Text      string    `json:"text"`
		PlaceName string    `json:"place_name"`
		Center    []float64 `json:"center"`
	} `json:"features"`
}

func (m *MapboxProvider) GetNearbyStations(ctx context.Context, lat, lng float64, radiusKm float64) ([]Station, error) {
	limit := m.stations.NearbyLimit
	if radiusKm > 0 && radiusKm < 15 && limit > 15 {
		limit = 15
	}
	raw, err := m.searchGasNear(ctx, lat, lng, limit, radiusKm)
	if err != nil {
		return nil, err
	}
	out := make([]Station, 0, len(raw))
	for _, st := range raw {
		st.DistanceFromKm = haversineKm(LatLng{Lat: lat, Lng: lng}, LatLng{Lat: st.Lat, Lng: st.Lng})
		if radiusKm > 0 && st.DistanceFromKm > radiusKm {
			continue
		}
		st.RouteLat = st.Lat
		st.RouteLng = st.Lng
		out = append(out, st)
	}
	sortStationsByDistance(out)
	return out, nil
}

func (m *MapboxProvider) GetStationsAlongRoute(ctx context.Context, route Route, maxDetourKm float64) ([]Station, error) {
	if maxDetourKm <= 0 {
		maxDetourKm = m.stations.DefaultMaxDetourKm
	}
	poly := DecodePolyline(route.Polyline, 6)
	if len(poly) < 2 {
		return nil, fmt.Errorf("mapbox: route has no geometry")
	}
	if route.DistanceKm <= 0 {
		route.DistanceKm = polylineLengthKm(poly)
	}

	merged := dedupeStations(m.collectAlongRoute(ctx, route.Polyline, poly, maxDetourKm), 120)
	if len(merged) == 0 {
		return nil, nil
	}
	out := attachStationsToRoute(merged, poly, route.DistanceKm, maxDetourKm)
	// Small relaxation only — avoid showing stations far from the driven road.
	if len(out) == 0 {
		relaxed := maxDetourKm + 3
		if relaxed > 15 {
			relaxed = 15
		}
		out = attachStationsToRoute(merged, poly, route.DistanceKm, relaxed)
	}
	return out, nil
}

func (m *MapboxProvider) collectAlongRoute(ctx context.Context, encodedPolyline string, poly []LatLng, maxDetourKm float64) []Station {
	seen := make(map[string]bool)
	var out []Station
	add := func(batch []Station) {
		for _, st := range batch {
			if !stationNearPolyline(poly, st.Lat, st.Lng, maxDetourKm) {
				continue
			}
			key := st.ID
			if key == "" {
				key = fmt.Sprintf("%.5f,%.5f", st.Lat, st.Lng)
			}
			if seen[key] {
				continue
			}
			seen[key] = true
			out = append(out, st)
		}
	}

	if batch, err := m.searchGasAlongRoute(ctx, encodedPolyline, maxDetourKm); err == nil {
		add(batch)
	}
	// Also sample along the route — merges with SAR (SAR alone can miss POIs or hit API limits).
	samples := sampleCountForTrip(polylineLengthKm(poly))
	points := samplePolyline(poly, samples)
	var mu sync.Mutex
	var wg sync.WaitGroup
	sem := make(chan struct{}, 5)
	sampleLimit := m.stations.SampleSearchLimit
	if sampleLimit > 15 {
		sampleLimit = 15
	}
	sampleRadius := sampleSearchRadiusKm(maxDetourKm)
	for _, pt := range points {
		wg.Add(1)
		go func(lat, lng float64) {
			defer wg.Done()
			sem <- struct{}{}
			defer func() { <-sem }()
			batch, err := m.searchGasNear(ctx, lat, lng, sampleLimit, sampleRadius)
			if err != nil {
				return
			}
			mu.Lock()
			add(batch)
			mu.Unlock()
		}(pt.Lat, pt.Lng)
	}
	wg.Wait()
	return out
}

func (m *MapboxProvider) searchGasAlongRoute(ctx context.Context, polyline string, maxDetourKm float64) ([]Station, error) {
	minutes := int(math.Round(maxDetourKm / 0.85)) // ~50 km/h detour budget in minutes
	if minutes < 8 {
		minutes = 8
	}
	if minutes > 40 {
		minutes = 40
	}
	limit := m.stations.AlongRouteLimit
	if limit <= 0 {
		limit = 25
	}
	q := url.Values{
		"access_token":   {m.token},
		"limit":          {fmt.Sprintf("%d", limit)},
		"language":       {"fr"},
		"sar_type":       {"isochrone"},
		"route":          {polyline},
		"route_geometry": {"polyline6"},
		"time_deviation": {fmt.Sprintf("%d", minutes)},
	}
	for _, cat := range []string{"gas_station", "fuel"} {
		var res searchboxCategoryResponse
		err := m.categorySearch(ctx, cat, q, &res)
		if err != nil {
			continue
		}
		stations := stationsFromSearchbox(res.Features)
		if len(stations) > 0 {
			return stations, nil
		}
	}
	return nil, fmt.Errorf("mapbox: no SAR results")
}

func (m *MapboxProvider) searchGasNear(ctx context.Context, lat, lng float64, limit int, radiusKm float64) ([]Station, error) {
	maxDist := radiusKm
	if maxDist <= 0 {
		maxDist = 40
	}
	q := url.Values{
		"proximity":    {fmt.Sprintf("%.6f,%.6f", lng, lat)},
		"limit":        {fmt.Sprintf("%d", limit)},
		"language":     {"fr"},
		"access_token": {m.token},
	}
	if m.country != "" {
		q.Set("country", m.country)
	}
	if radiusKm > 0 && radiusKm < 40 {
		// ~1° ≈ 111 km at equator; bias POIs around the sample point.
		deg := math.Min(0.35, radiusKm/111.0)
		q.Set("radius", fmt.Sprintf("%.5f", deg))
	}

	for _, cat := range []string{"gas_station", "fuel"} {
		var res searchboxCategoryResponse
		if err := m.categorySearch(ctx, cat, q, &res); err == nil {
			stations := stationsFromSearchbox(res.Features)
			if len(stations) > 0 {
				return stations, nil
			}
		}
	}

	// Retry category search without country filter (some POIs are miscoded).
	qNoCountry := cloneQuery(q)
	qNoCountry.Del("country")
	for _, cat := range []string{"gas_station", "fuel"} {
		var res searchboxCategoryResponse
		if err := m.categorySearch(ctx, cat, qNoCountry, &res); err == nil {
			stations := stationsFromSearchbox(res.Features)
			if len(stations) > 0 {
				return stations, nil
			}
		}
	}

	if st, err := m.searchGasSearchboxText(ctx, lat, lng, limit, maxDist); err == nil && len(st) > 0 {
		return st, nil
	}
	if st, err := m.searchGasByForwardGeocode(ctx, lat, lng, limit, maxDist); err == nil && len(st) > 0 {
		return st, nil
	}
	if st, err := m.searchGasGeocodeV6(ctx, lat, lng, limit); err == nil && len(st) > 0 {
		return st, nil
	}
	if st, err := m.searchGasGeocodingV5(ctx, lat, lng, limit); err == nil && len(st) > 0 {
		return st, nil
	}
	if osm, err := searchOSMFuelNear(ctx, lat, lng, radiusKm, limit); err == nil && len(osm) > 0 {
		return osm, nil
	}
	return nil, nil
}

func searchboxTextQueries(area string) []string {
	area = strings.TrimSpace(area)
	withArea := func(s string) string {
		if area == "" {
			return s
		}
		return s + " " + area
	}
	return []string{
		withArea("station service"),
		withArea("station essence"),
		withArea("station carburant"),
		withArea("Total Energies"),
		withArea("Shell"),
		withArea("Oryx"),
		withArea("Petro Ivoire"),
		"station service",
		"gas station",
	}
}

func (m *MapboxProvider) searchGasSearchboxText(ctx context.Context, lat, lng float64, limit int, maxDistKm float64) ([]Station, error) {
	if limit <= 0 {
		limit = 10
	}
	near := LatLng{Lat: lat, Lng: lng}
	area := m.areaQuerySuffix(ctx, lat, lng)
	seen := make(map[string]bool)
	out := make([]Station, 0, limit)
	perQuery := 10
	if perQuery > limit {
		perQuery = limit
	}
	for _, term := range searchboxTextQueries(area) {
		q := url.Values{
			"q":            {term},
			"proximity":    {fmt.Sprintf("%.6f,%.6f", lng, lat)},
			"limit":        {fmt.Sprintf("%d", perQuery)},
			"language":     {"fr"},
			"access_token": {m.token},
		}
		if m.country != "" {
			q.Set("country", m.country)
		}
		var res searchboxCategoryResponse
		if err := m.searchboxForward(ctx, q, &res); err != nil {
			continue
		}
		for _, st := range stationsFromSearchbox(res.Features) {
			if maxDistKm > 0 && haversineKm(near, LatLng{Lat: st.Lat, Lng: st.Lng}) > maxDistKm {
				continue
			}
			key := st.ID
			if key == "" {
				key = fmt.Sprintf("%.5f,%.5f", st.Lat, st.Lng)
			}
			if seen[key] {
				continue
			}
			seen[key] = true
			out = append(out, st)
			if len(out) >= limit {
				return out, nil
			}
		}
	}
	if len(out) == 0 {
		return nil, fmt.Errorf("mapbox: no searchbox forward fuel POIs")
	}
	return out, nil
}

func fuelGeocodeQueries(areaSuffix string) []string {
	area := strings.TrimSpace(areaSuffix)
	base := []string{
		"station service",
		"station essence",
		"station carburant",
		"Total Energies",
		"Shell",
		"Oryx",
		"Petro Ivoire",
	}
	out := make([]string, 0, len(base)*2)
	for _, q := range base {
		if area != "" {
			out = append(out, q+" "+area)
		}
		out = append(out, q)
	}
	return out
}

func (m *MapboxProvider) areaQuerySuffix(ctx context.Context, lat, lng float64) string {
	rev, err := m.ReverseGeocode(ctx, lat, lng)
	if err != nil || rev == nil {
		if strings.EqualFold(m.country, "ci") {
			return "Abidjan"
		}
		return ""
	}
	parts := strings.Split(rev.Label, ",")
	for i := len(parts) - 1; i >= 0; i-- {
		p := strings.TrimSpace(parts[i])
		if len(p) < 2 {
			continue
		}
		lower := strings.ToLower(p)
		if strings.Contains(lower, "ivoire") || lower == "côte d'ivoire" || lower == "cote d'ivoire" {
			continue
		}
		return p
	}
	if len(parts) > 0 {
		return strings.TrimSpace(parts[0])
	}
	return ""
}

func (m *MapboxProvider) geocodeForwardPlaces(ctx context.Context, query string, limit int, near LatLng, useProximity bool) ([]Place, error) {
	if limit <= 0 {
		limit = 5
	}
	q := url.Values{
		"q":            {query},
		"limit":        {fmt.Sprintf("%d", limit)},
		"access_token": {m.token},
	}
	if m.country != "" {
		q.Set("country", m.country)
	}
	// Proximity on generic terms often returns the locality centroid, not fuel POIs.
	if useProximity && (near.Lat != 0 || near.Lng != 0) {
		q.Set("proximity", fmt.Sprintf("%.6f,%.6f", near.Lng, near.Lat))
	}
	var res geocodeResponse
	if err := m.get(ctx, "/search/geocode/v6/forward", q, &res); err != nil {
		return nil, err
	}
	places := res.places()
	if len(places) == 0 {
		return nil, ErrNoResults
	}
	return places, nil
}

func (m *MapboxProvider) placeToFuelStation(p Place) (Station, bool) {
	name := strings.TrimSpace(p.Label)
	if name == "" || isClearlyNotFuel(name) {
		return Station{}, false
	}
	short := strings.TrimSpace(strings.Split(name, ",")[0])
	if !isLikelyFuelName(name) && !strings.Contains(strings.ToLower(short), "station") {
		return Station{}, false
	}
	key := fmt.Sprintf("%.5f,%.5f", p.Lat, p.Lng)
	return Station{
		ID:            key,
		Name:          short,
		Brand:         guessFuelBrand(name),
		Town:          townFromAddress("", name),
		Lat:           p.Lat,
		Lng:           p.Lng,
		PricePerLiter: 0,
		Currency:      "FCFA",
		FuelType:      "petrol",
	}, true
}

// Forward geocode v6 with city/region context (same API as trip address search).
func (m *MapboxProvider) searchGasByForwardGeocode(ctx context.Context, lat, lng float64, limit int, maxDistKm float64) ([]Station, error) {
	if limit <= 0 {
		limit = 10
	}
	near := LatLng{Lat: lat, Lng: lng}
	perQuery := 5
	if limit < perQuery {
		perQuery = limit
	}
	seen := make(map[string]bool)
	out := make([]Station, 0, limit)
	for _, query := range fuelGeocodeQueries(m.areaQuerySuffix(ctx, lat, lng)) {
		places, err := m.geocodeForwardPlaces(ctx, query, perQuery, near, false)
		if err != nil {
			continue
		}
		for _, p := range places {
			if maxDistKm > 0 && haversineKm(near, LatLng{Lat: p.Lat, Lng: p.Lng}) > maxDistKm {
				continue
			}
			st, ok := m.placeToFuelStation(p)
			if !ok {
				continue
			}
			if seen[st.ID] {
				continue
			}
			seen[st.ID] = true
			out = append(out, st)
			if len(out) >= limit {
				return out, nil
			}
		}
	}
	if len(out) == 0 {
		return nil, fmt.Errorf("mapbox: no forward geocode fuel POIs")
	}
	return out, nil
}

// searchGasGeocodeV6 kept for tests; delegates to area-aware forward search.
func (m *MapboxProvider) searchGasGeocodeV6(ctx context.Context, lat, lng float64, limit int) ([]Station, error) {
	return m.searchGasByForwardGeocode(ctx, lat, lng, limit, 40)
}

func cloneQuery(q url.Values) url.Values {
	out := url.Values{}
	for k, vs := range q {
		for _, v := range vs {
			out.Add(k, v)
		}
	}
	return out
}

func (m *MapboxProvider) searchboxForward(ctx context.Context, q url.Values, out *searchboxCategoryResponse) error {
	return m.get(ctx, "/search/searchbox/v1/forward", q, out)
}

func (m *MapboxProvider) categorySearch(ctx context.Context, category string, q url.Values, out *searchboxCategoryResponse) error {
	path := "/search/searchbox/v1/category/" + category
	if len(q.Get("route")) > 6000 {
		return m.postForm(ctx, path, q, out)
	}
	return m.get(ctx, path, q, out)
}

func (m *MapboxProvider) postForm(ctx context.Context, path string, q url.Values, out any) error {
	token := q.Get("access_token")
	q.Del("access_token")
	req, err := http.NewRequestWithContext(ctx, http.MethodPost, m.baseURL+path+"?access_token="+url.QueryEscape(token), strings.NewReader(q.Encode()))
	if err != nil {
		return err
	}
	req.Header.Set("Content-Type", "application/x-www-form-urlencoded")
	res, err := m.client.Do(req)
	if err != nil {
		return fmt.Errorf("mapbox: %w", err)
	}
	defer res.Body.Close()
	if res.StatusCode != http.StatusOK {
		_, _ = io.Copy(io.Discard, res.Body)
		return fmt.Errorf("mapbox %s: HTTP %d", path, res.StatusCode)
	}
	return json.NewDecoder(res.Body).Decode(out)
}

func (m *MapboxProvider) searchGasGeocodingV5(ctx context.Context, lat, lng float64, limit int) ([]Station, error) {
	queries := []string{"station-service", "station-essence", "gas station"}
	var lastErr error
	for _, term := range queries {
		q := url.Values{
			"access_token": {m.token},
			"proximity":    {fmt.Sprintf("%.6f,%.6f", lng, lat)},
			"types":        {"poi"},
			"limit":        {fmt.Sprintf("%d", limit)},
			"language":     {"fr"},
		}
		if m.country != "" {
			q.Set("country", m.country)
		}
		var res geocodeV5Response
		path := "/geocoding/v5/mapbox.places/" + url.PathEscape(term) + ".json"
		if err := m.get(ctx, path, q, &res); err != nil {
			lastErr = err
			continue
		}
		out := make([]Station, 0, len(res.Features))
		for _, f := range res.Features {
			if len(f.Center) < 2 {
				continue
			}
			name := strings.TrimSpace(f.Text)
			if name == "" {
				name = strings.TrimSpace(f.PlaceName)
			}
			if name == "" || isClearlyNotFuel(name+" "+f.PlaceName) {
				continue
			}
			id := f.ID
			if id == "" {
				id = fmt.Sprintf("%.5f,%.5f", f.Center[1], f.Center[0])
			}
			out = append(out, Station{
				ID:            id,
				Name:          name,
				Brand:         guessFuelBrand(name),
				Town:          townFromAddress("", f.PlaceName),
				Lat:           f.Center[1],
				Lng:           f.Center[0],
				PricePerLiter: 0,
				Currency:      "FCFA",
				FuelType:      "petrol",
			})
		}
		if len(out) > 0 {
			return out, nil
		}
	}
	if lastErr != nil {
		return nil, lastErr
	}
	return nil, nil
}

func stationsFromSearchbox(features []searchboxFeature) []Station {
	out := make([]Station, 0, len(features))
	for _, f := range features {
		name := strings.TrimSpace(f.Properties.NamePreferred)
		if name == "" {
			name = strings.TrimSpace(f.Properties.Name)
		}
		if name == "" && f.Properties.FullAddress != "" {
			name = strings.TrimSpace(strings.Split(f.Properties.FullAddress, ",")[0])
		}
		if name == "" {
			continue
		}
		if !isFuelSearchboxPOI(f.Properties.FeatureType, f.Properties.PoiCategoryIDs, name) {
			continue
		}
		lat, lng, ok := coordsFromFeature(f)
		if !ok {
			continue
		}
		id := f.Properties.MapboxID
		if id == "" {
			id = fmt.Sprintf("%.5f,%.5f", lat, lng)
		}
		town := ""
		if f.Properties.Context.Place != nil {
			town = f.Properties.Context.Place.Name
		}
		if town == "" && f.Properties.Context.Locality != nil {
			town = f.Properties.Context.Locality.Name
		}
		if town == "" {
			town = townFromAddress(f.Properties.Place, f.Properties.FullAddress)
		}
		out = append(out, Station{
			ID:            id,
			Name:          name,
			Brand:         guessFuelBrand(name),
			Town:          town,
			Lat:           lat,
			Lng:           lng,
			PricePerLiter: 0,
			Currency:      "FCFA",
			FuelType:      "petrol",
		})
	}
	return out
}

func coordsFromFeature(f searchboxFeature) (lat, lng float64, ok bool) {
	if len(f.Properties.Coordinates.Routable) > 0 {
		rp := f.Properties.Coordinates.Routable[0]
		if rp.Latitude != 0 || rp.Longitude != 0 {
			return rp.Latitude, rp.Longitude, true
		}
	}
	if f.Properties.Coordinates.Latitude != 0 || f.Properties.Coordinates.Longitude != 0 {
		return f.Properties.Coordinates.Latitude, f.Properties.Coordinates.Longitude, true
	}
	if len(f.Geometry.Coordinates) >= 2 {
		return f.Geometry.Coordinates[1], f.Geometry.Coordinates[0], true
	}
	return 0, 0, false
}

func sampleCountForTrip(distanceKm float64) int {
	switch {
	case distanceKm < 40:
		return 5
	case distanceKm < 120:
		return 8
	case distanceKm < 250:
		return 12
	default:
		return 16
	}
}

func townFromAddress(placeFormatted, full string) string {
	if placeFormatted != "" {
		parts := strings.Split(placeFormatted, ",")
		if len(parts) > 0 {
			return strings.TrimSpace(parts[0])
		}
	}
	if full != "" {
		parts := strings.Split(full, ",")
		if len(parts) > 1 {
			return strings.TrimSpace(parts[len(parts)-2])
		}
	}
	return ""
}

func guessFuelBrand(name string) string {
	lower := strings.ToLower(name)
	brands := []struct {
		key  string
		show string
	}{
		{"total", "Total"},
		{"shell", "Shell"},
		{"oryx", "Oryx"},
		{"petro", "Petro Ivoire"},
		{"vivo", "Vivo Energy"},
		{"bp ", "BP"},
		{"esso", "Esso"},
		{"oilibya", "Oilibya"},
	}
	for _, b := range brands {
		if strings.Contains(lower, b.key) {
			return b.show
		}
	}
	return ""
}
