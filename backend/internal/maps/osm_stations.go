package maps

import (
	"context"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"net/url"
	"strings"
	"time"
)

const photonAPIURL = "https://photon.komoot.io/api/"

// Photon (OpenStreetMap) fuel POIs when Mapbox Search Box has no coverage (common in parts of Africa).
func searchOSMFuelNear(ctx context.Context, lat, lng, radiusKm float64, limit int) ([]Station, error) {
	if limit <= 0 {
		limit = 25
	}
	if radiusKm <= 0 {
		radiusKm = 25
	}
	near := LatLng{Lat: lat, Lng: lng}
	seen := make(map[string]bool)
	out := make([]Station, 0, limit)
	for _, term := range []string{"station", "carburant", "essence", "total", "shell"} {
		batch, err := photonFuelSearch(ctx, term, lat, lng, limit)
		if err != nil {
			continue
		}
		for _, st := range batch {
			if haversineKm(near, LatLng{Lat: st.Lat, Lng: st.Lng}) > radiusKm {
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
		return nil, fmt.Errorf("photon: no fuel POIs")
	}
	return out, nil
}

// photonFuelNearOnce is a single Photon query filtered to fuel amenities within radiusKm.
func photonFuelNearOnce(ctx context.Context, lat, lng, radiusKm float64, limit int) ([]Station, error) {
	batch, err := photonFuelSearch(ctx, "station", lat, lng, limit)
	if err != nil {
		return nil, err
	}
	near := LatLng{Lat: lat, Lng: lng}
	out := batch[:0]
	for _, st := range batch {
		if haversineKm(near, LatLng{Lat: st.Lat, Lng: st.Lng}) <= radiusKm {
			out = append(out, st)
		}
	}
	return out, nil
}

func photonFuelSearch(ctx context.Context, query string, lat, lng float64, limit int) ([]Station, error) {
	q := url.Values{
		"q":       {query},
		"lat":     {fmt.Sprintf("%.6f", lat)},
		"lon":     {fmt.Sprintf("%.6f", lng)},
		"limit":   {fmt.Sprintf("%d", limit)},
		"osm_tag": {"amenity:fuel"},
		"lang":    {"fr"},
	}
	req, err := http.NewRequestWithContext(ctx, http.MethodGet, photonAPIURL+"?"+q.Encode(), nil)
	if err != nil {
		return nil, err
	}
	req.Header.Set("User-Agent", "fuel-planner/1.0 (station lookup)")
	client := &http.Client{Timeout: 20 * time.Second}
	res, err := client.Do(req)
	if err != nil {
		return nil, fmt.Errorf("photon: %w", err)
	}
	defer res.Body.Close()
	if res.StatusCode != http.StatusOK {
		_, _ = io.Copy(io.Discard, res.Body)
		return nil, fmt.Errorf("photon: HTTP %d", res.StatusCode)
	}
	var parsed photonResponse
	if err := json.NewDecoder(res.Body).Decode(&parsed); err != nil {
		return nil, fmt.Errorf("photon: %w", err)
	}
	return stationsFromPhoton(parsed.Features), nil
}

type photonResponse struct {
	Features []photonFeature `json:"features"`
}

type photonFeature struct {
	Geometry struct {
		Coordinates []float64 `json:"coordinates"` // [lng, lat]
	} `json:"geometry"`
	Properties struct {
		Name     string `json:"name"`
		City     string `json:"city"`
		District string `json:"district"`
		State    string `json:"state"`
		OsmKey   string `json:"osm_key"`
		OsmValue string `json:"osm_value"`
		OsmID    int64  `json:"osm_id"`
		OsmType  string `json:"osm_type"`
	} `json:"properties"`
}

func stationsFromPhoton(features []photonFeature) []Station {
	out := make([]Station, 0, len(features))
	for _, f := range features {
		if f.Properties.OsmKey != "amenity" || f.Properties.OsmValue != "fuel" {
			continue
		}
		if len(f.Geometry.Coordinates) < 2 {
			continue
		}
		lng, lat := f.Geometry.Coordinates[0], f.Geometry.Coordinates[1]
		name := strings.TrimSpace(f.Properties.Name)
		if name == "" {
			name = "Station-service"
		}
		town := strings.TrimSpace(f.Properties.City)
		if town == "" {
			town = strings.TrimSpace(f.Properties.District)
		}
		if town == "" {
			town = strings.TrimSpace(f.Properties.State)
		}
		id := fmt.Sprintf("osm.%s.%d", f.Properties.OsmType, f.Properties.OsmID)
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
