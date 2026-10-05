package maps

import (
	"context"
	"net/http"
	"strings"
	"testing"
)

func TestMapboxGasStationCategory(t *testing.T) {
	p := newTestMapbox(t, func(w http.ResponseWriter, r *http.Request) {
		if !strings.HasPrefix(r.URL.Path, "/search/searchbox/v1/category/gas_station") {
			t.Errorf("path = %s", r.URL.Path)
		}
		if r.URL.Query().Get("proximity") != "-4.008300,5.360000" {
			t.Errorf("proximity = %q", r.URL.Query().Get("proximity"))
		}
		_, _ = w.Write([]byte(`{
			"features":[{
				"geometry":{"coordinates":[-4.008300,5.360000]},
				"properties":{
					"name":"Total Energies",
					"mapbox_id":"poi.abc",
					"context":{"place":{"name":"N'Douci"}}
				}
			}]
		}`))
	})
	stations, err := p.GetNearbyStations(context.Background(), 5.36, -4.0083, 25)
	if err != nil {
		t.Fatal(err)
	}
	if len(stations) != 1 || stations[0].Name != "Total Energies" || stations[0].Town != "N'Douci" {
		t.Fatalf("got %+v", stations)
	}
}
