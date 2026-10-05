package maps

import (
	"fmt"
	"testing"
	"time"
)

func TestStationCacheExpiresAndBounds(t *testing.T) {
	c := newStationCache()
	now := time.Date(2026, 10, 5, 12, 0, 0, 0, time.UTC)
	c.now = func() time.Time { return now }

	c.put("a", []Station{{ID: "1"}})
	if got, ok := c.get("a"); !ok || len(got) != 1 {
		t.Fatalf("expected a cached station, got %v %v", got, ok)
	}
	now = now.Add(stationCacheTTL + time.Minute)
	if _, ok := c.get("a"); ok {
		t.Fatal("expected the entry to expire")
	}

	for i := 0; i < stationCacheMaxSize+10; i++ {
		c.put(fmt.Sprintf("k%d", i), nil)
	}
	if len(c.entries) > stationCacheMaxSize {
		t.Fatalf("cache grew past its bound: %d", len(c.entries))
	}
}

func TestNearbyCacheKeyIgnoresJitter(t *testing.T) {
	if nearbyCacheKey(5.36001, -4.00831, 30) != nearbyCacheKey(5.36012, -4.00838, 30) {
		t.Fatal("points ~10 m apart should share a cache key")
	}
}
