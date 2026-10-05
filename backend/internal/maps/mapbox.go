package maps

import (
	"context"
	"encoding/json"
	"errors"
	"fmt"
	"net/http"
	"net/url"
	"strconv"
	"strings"
	"time"
)

// MapboxProvider geocodes with the Mapbox Geocoding API v6, routes with Directions v5,
// and discovers fuel POIs with the Search Box category API (no pump prices).
type MapboxProvider struct {
	token    string
	country  string // ISO 3166 alpha-2 bias for geocoding, e.g. "ci"
	baseURL  string
	client   *http.Client
	stations StationSearchSettings
	cache    *stationCache
}

func NewMapboxProvider(token, country string) *MapboxProvider {
	return &MapboxProvider{
		token:    token,
		country:  country,
		baseURL:  "https://api.mapbox.com",
		client:   &http.Client{Timeout: 20 * time.Second},
		stations: StationSearchSettings{}.WithDefaults(),
		cache:    newStationCache(),
	}
}

func (m *MapboxProvider) SetStationSearchSettings(s StationSearchSettings) {
	m.stations = s.WithDefaults()
}

// WithBaseURL points the provider at another host (tests).
func (m *MapboxProvider) WithBaseURL(u string) *MapboxProvider {
	m.baseURL = strings.TrimRight(u, "/")
	return m
}

var ErrNoResults = errors.New("mapbox: no results")

type geocodeResponse struct {
	Features []struct {
		Geometry struct {
			Coordinates []float64 `json:"coordinates"` // [lng, lat]
		} `json:"geometry"`
		Properties struct {
			Name           string `json:"name"`
			FullAddress    string `json:"full_address"`
			PlaceFormatted string `json:"place_formatted"`
		} `json:"properties"`
	} `json:"features"`
}

func (r geocodeResponse) places() []Place {
	out := make([]Place, 0, len(r.Features))
	for _, f := range r.Features {
		if len(f.Geometry.Coordinates) < 2 {
			continue
		}
		label := f.Properties.FullAddress
		if label == "" {
			label = strings.TrimSpace(strings.Join([]string{f.Properties.Name, f.Properties.PlaceFormatted}, ", "))
		}
		out = append(out, Place{Label: label, Lng: f.Geometry.Coordinates[0], Lat: f.Geometry.Coordinates[1]})
	}
	return out
}

// Geocode resolves free text. A "lat,lng" query is passed through untouched so a client
// that already picked a suggestion does not pay for a second lookup.
func (m *MapboxProvider) Geocode(ctx context.Context, query string) ([]Place, error) {
	if p, ok := parseLatLng(query); ok {
		return []Place{p}, nil
	}
	q := url.Values{"q": {query}, "limit": {"1"}, "access_token": {m.token}}
	if m.country != "" {
		q.Set("country", m.country)
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

func (m *MapboxProvider) ReverseGeocode(ctx context.Context, lat, lng float64) (*Place, error) {
	q := url.Values{
		"latitude":     {strconv.FormatFloat(lat, 'f', 6, 64)},
		"longitude":    {strconv.FormatFloat(lng, 'f', 6, 64)},
		"limit":        {"1"},
		"access_token": {m.token},
	}
	var res geocodeResponse
	if err := m.get(ctx, "/search/geocode/v6/reverse", q, &res); err != nil {
		return nil, err
	}
	places := res.places()
	if len(places) == 0 {
		return nil, ErrNoResults
	}
	return &places[0], nil
}

type directionsResponse struct {
	Code   string `json:"code"`
	Routes []struct {
		Distance float64 `json:"distance"` // metres
		Duration float64 `json:"duration"` // seconds
		Geometry string  `json:"geometry"` // polyline6
	} `json:"routes"`
}

func mapboxDrivingProfile(profile string) string {
	switch strings.ToLower(strings.TrimSpace(profile)) {
	case "fastest":
		return "driving-traffic"
	case "efficient", "cheapest":
		return "driving"
	default:
		return "driving-traffic"
	}
}

func (m *MapboxProvider) GetRoute(ctx context.Context, req RouteRequest) (*Route, error) {
	stops := append([]Place{req.Origin}, req.Waypoints...)
	stops = append(stops, req.Destination)
	coords := make([]string, len(stops))
	for i, p := range stops {
		coords[i] = fmt.Sprintf("%.6f,%.6f", p.Lng, p.Lat)
	}
	driving := mapboxDrivingProfile(req.Profile)
	q := url.Values{
		"geometries":   {"polyline6"},
		"overview":     {"full"},
		"alternatives": {"false"},
		"access_token": {m.token},
	}
	var res directionsResponse
	if err := m.get(ctx, "/directions/v5/mapbox/"+driving+"/"+strings.Join(coords, ";"), q, &res); err != nil {
		return nil, err
	}
	if res.Code != "Ok" || len(res.Routes) == 0 {
		return nil, fmt.Errorf("mapbox directions: %s", res.Code)
	}
	r := res.Routes[0]
	km := r.Distance / 1000
	return &Route{
		DistanceKm:      km,
		DurationSeconds: int(r.Duration),
		Polyline:        r.Geometry,
		Provider:        "mapbox",
		// The return leg is assumed to mirror the outbound one; good enough for fuel planning.
		OutboundDistanceKm: km,
		ReturnDistanceKm:   km,
	}, nil
}

func (m *MapboxProvider) get(ctx context.Context, path string, q url.Values, out any) error {
	req, err := http.NewRequestWithContext(ctx, http.MethodGet, m.baseURL+path+"?"+q.Encode(), nil)
	if err != nil {
		return err
	}
	res, err := m.client.Do(req)
	if err != nil {
		return fmt.Errorf("mapbox: %w", err)
	}
	defer res.Body.Close()
	if res.StatusCode != http.StatusOK {
		// Never echo the request URL: it carries the access token.
		return fmt.Errorf("mapbox %s: HTTP %d", path, res.StatusCode)
	}
	return json.NewDecoder(res.Body).Decode(out)
}

func parseLatLng(s string) (Place, bool) {
	parts := strings.Split(s, ",")
	if len(parts) != 2 {
		return Place{}, false
	}
	lat, err1 := strconv.ParseFloat(strings.TrimSpace(parts[0]), 64)
	lng, err2 := strconv.ParseFloat(strings.TrimSpace(parts[1]), 64)
	if err1 != nil || err2 != nil || lat < -90 || lat > 90 || lng < -180 || lng > 180 {
		return Place{}, false
	}
	return Place{Label: strings.TrimSpace(s), Lat: lat, Lng: lng}, true
}
