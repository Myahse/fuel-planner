package maps

import (
	"context"
	"os"
	"path/filepath"
	"testing"

	"github.com/joho/godotenv"
)

func TestLiveNearbyStations(t *testing.T) {
	_ = godotenv.Load(filepath.Join("..", "..", ".env"))
	key := os.Getenv("MAP_API_KEY")
	if key == "" || os.Getenv("MAP_PROVIDER") != "mapbox" {
		t.Skip("MAP_API_KEY and MAP_PROVIDER=mapbox required")
	}
	p := NewMapboxProvider(key, os.Getenv("MAP_COUNTRY"))
	if p.country == "" {
		p.country = "ci"
	}
	ctx := context.Background()

	st, err := p.GetNearbyStations(ctx, 5.36, -4.0083, 30)
	if err != nil {
		t.Fatalf("GetNearbyStations: %v", err)
	}
	t.Logf("stations=%d", len(st))
	if len(st) == 0 {
		t.Fatal("expected at least one station near Abidjan (Mapbox or OSM fallback)")
	}
}
