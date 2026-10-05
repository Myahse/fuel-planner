package maps

import "testing"

func TestStationsFromPhoton(t *testing.T) {
	raw := photonResponse{
		Features: []photonFeature{{
			Geometry: struct {
				Coordinates []float64 `json:"coordinates"`
			}{Coordinates: []float64{-3.99, 5.38}},
			Properties: struct {
				Name     string `json:"name"`
				City     string `json:"city"`
				District string `json:"district"`
				State    string `json:"state"`
				OsmKey   string `json:"osm_key"`
				OsmValue string `json:"osm_value"`
				OsmID    int64  `json:"osm_id"`
				OsmType  string `json:"osm_type"`
			}{
				Name: "Station Service Shell", City: "Abidjan",
				OsmKey: "amenity", OsmValue: "fuel", OsmID: 1, OsmType: "N",
			},
		}},
	}
	st := stationsFromPhoton(raw.Features)
	if len(st) != 1 || st[0].Brand != "Shell" || st[0].Town != "Abidjan" {
		t.Fatalf("got %+v", st)
	}
}
