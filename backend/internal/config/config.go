package config

import (
	"fmt"
	"os"
	"strconv"
	"strings"
	"time"

	"github.com/fuel-planner/backend/internal/maps"
	"github.com/joho/godotenv"
)

type Config struct {
	Port               string
	DatabaseURL        string
	JWTSecret          string
	JWTAccessTTL       time.Duration
	JWTRefreshTTL      time.Duration
	CORSAllowedOrigins []string
	MapProvider        string
	MapAPIKey          string
	MapCountry         string
	StationSearch      maps.StationSearchSettings
}

func Load() (Config, error) {
	// Optional: load backend/.env when present (ignored in production with real env vars).
	_ = godotenv.Load()

	accessTTL, err := time.ParseDuration(getEnv("JWT_ACCESS_TTL", "15m"))
	if err != nil {
		return Config{}, fmt.Errorf("JWT_ACCESS_TTL: %w", err)
	}
	refreshTTL, err := time.ParseDuration(getEnv("JWT_REFRESH_TTL", "168h"))
	if err != nil {
		return Config{}, fmt.Errorf("JWT_REFRESH_TTL: %w", err)
	}

	origins := strings.Split(getEnv("CORS_ALLOWED_ORIGINS", "http://localhost:5173"), ",")
	for i := range origins {
		origins[i] = strings.TrimSpace(origins[i])
	}

	cfg := Config{
		Port:               getEnv("PORT", "8080"),
		DatabaseURL:        getEnv("DATABASE_URL", ""),
		JWTSecret:          getEnv("JWT_SECRET", ""),
		JWTAccessTTL:       accessTTL,
		JWTRefreshTTL:      refreshTTL,
		CORSAllowedOrigins: origins,
		MapProvider:        getEnv("MAP_PROVIDER", "mock"),
		MapAPIKey:          getEnv("MAP_API_KEY", ""),
		MapCountry:         getEnv("MAP_COUNTRY", "ci"),
		StationSearch: maps.StationSearchSettings{
			DefaultMaxDetourKm: getEnvFloat("MAP_STATIONS_MAX_DETOUR_KM", 12),
			AlongRouteLimit:    getEnvInt("MAP_STATIONS_ALONG_LIMIT", 25),
			NearbyRadiusKm:     getEnvFloat("MAP_STATIONS_NEARBY_RADIUS_KM", 30),
			NearbyLimit:        getEnvInt("MAP_STATIONS_NEARBY_LIMIT", 40),
			SampleSearchLimit:  getEnvInt("MAP_STATIONS_SAMPLE_LIMIT", 25),
		}.WithDefaults(),
	}

	if cfg.DatabaseURL == "" {
		return Config{}, fmt.Errorf("DATABASE_URL is required")
	}
	if cfg.JWTSecret == "" {
		return Config{}, fmt.Errorf("JWT_SECRET is required")
	}

	return cfg, nil
}

func getEnv(key, fallback string) string {
	if v := os.Getenv(key); v != "" {
		return v
	}
	return fallback
}

func getEnvFloat(key string, fallback float64) float64 {
	v := os.Getenv(key)
	if v == "" {
		return fallback
	}
	f, err := strconv.ParseFloat(strings.TrimSpace(v), 64)
	if err != nil || f <= 0 {
		return fallback
	}
	return f
}

func getEnvInt(key string, fallback int) int {
	v := os.Getenv(key)
	if v == "" {
		return fallback
	}
	n, err := strconv.Atoi(strings.TrimSpace(v))
	if err != nil || n <= 0 {
		return fallback
	}
	return n
}
