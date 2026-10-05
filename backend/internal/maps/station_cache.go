package maps

import (
	"crypto/sha256"
	"encoding/hex"
	"fmt"
	"sync"
	"time"
)

// Station lookups fan out to several Mapbox and OpenStreetMap calls, and stations rarely
// move, so results are kept for a few hours per route or search point.
const (
	stationCacheTTL     = 6 * time.Hour
	stationCacheMaxSize = 256
)

type stationCacheEntry struct {
	stations []Station
	expires  time.Time
}

type stationCache struct {
	mu      sync.Mutex
	entries map[string]stationCacheEntry
	now     func() time.Time
}

func newStationCache() *stationCache {
	return &stationCache{entries: make(map[string]stationCacheEntry), now: time.Now}
}

func (c *stationCache) get(key string) ([]Station, bool) {
	c.mu.Lock()
	defer c.mu.Unlock()
	e, ok := c.entries[key]
	if !ok || c.now().After(e.expires) {
		delete(c.entries, key)
		return nil, false
	}
	return append([]Station(nil), e.stations...), true
}

func (c *stationCache) put(key string, stations []Station) {
	c.mu.Lock()
	defer c.mu.Unlock()
	now := c.now()
	if len(c.entries) >= stationCacheMaxSize {
		// Drop expired entries first, then the one closest to expiring.
		oldestKey, oldest := "", time.Time{}
		for k, e := range c.entries {
			if now.After(e.expires) {
				delete(c.entries, k)
				continue
			}
			if oldestKey == "" || e.expires.Before(oldest) {
				oldestKey, oldest = k, e.expires
			}
		}
		if len(c.entries) >= stationCacheMaxSize {
			delete(c.entries, oldestKey)
		}
	}
	c.entries[key] = stationCacheEntry{stations: append([]Station(nil), stations...), expires: now.Add(stationCacheTTL)}
}

func routeCacheKey(polyline string, maxDetourKm float64) string {
	sum := sha256.Sum256([]byte(polyline))
	return fmt.Sprintf("route:%s:%.1f", hex.EncodeToString(sum[:12]), maxDetourKm)
}

// Nearby searches share a key within ~100 m so small GPS jitter still hits the cache.
func nearbyCacheKey(lat, lng, radiusKm float64) string {
	return fmt.Sprintf("near:%.3f,%.3f:%.1f", lat, lng, radiusKm)
}
