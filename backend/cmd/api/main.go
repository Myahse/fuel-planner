package main

import (
	"context"
	"log"
	"net/http"
	"os"
	"os/signal"
	"syscall"
	"time"

	"github.com/fuel-planner/backend/internal/auth"
	"github.com/fuel-planner/backend/internal/config"
	"github.com/fuel-planner/backend/internal/database"
	"github.com/fuel-planner/backend/internal/fuel"
	"github.com/fuel-planner/backend/internal/maps"
	"github.com/fuel-planner/backend/internal/middleware"
	"github.com/fuel-planner/backend/internal/trips"
	"github.com/fuel-planner/backend/internal/vehicles"
	"github.com/go-chi/chi/v5"
	chimw "github.com/go-chi/chi/v5/middleware"
)

func main() {
	cfg, err := config.Load()
	if err != nil {
		log.Fatalf("config: %v", err)
	}

	if err := database.RunMigrations(cfg.DatabaseURL); err != nil {
		log.Fatalf("migrations: %v", err)
	}

	ctx := context.Background()
	pool, err := database.Connect(ctx, cfg.DatabaseURL)
	if err != nil {
		log.Fatalf("database: %v", err)
	}
	defer pool.Close()

	tokens := auth.NewTokenService(cfg.JWTSecret, cfg.JWTAccessTTL, cfg.JWTRefreshTTL)
	authHandler := auth.NewHandler(pool, tokens)
	vehicleRepo := vehicles.NewRepository(pool)
	vehicleHandler := vehicles.NewHandler(vehicleRepo)
	fuelHandler := fuel.NewHandler(pool, vehicleRepo)
	var mapProvider maps.MapProvider = maps.NewMockProvider()
	if cfg.MapProvider == "mapbox" {
		if cfg.MapAPIKey == "" {
			log.Fatalf("MAP_PROVIDER=mapbox requires MAP_API_KEY (a Mapbox access token)")
		}
		mapProvider = maps.NewMapboxProvider(cfg.MapAPIKey, cfg.MapCountry)
	}
	log.Printf("map provider: %s", cfg.MapProvider)
	tripHandler := trips.NewHandler(pool, vehicleRepo, mapProvider)

	r := chi.NewRouter()
	r.Use(chimw.RequestID)
	r.Use(chimw.RealIP)
	r.Use(chimw.Recoverer)
	r.Use(middleware.CORS(cfg.CORSAllowedOrigins))
	r.Use(middleware.Logger)

	r.Get("/health", func(w http.ResponseWriter, _ *http.Request) {
		w.WriteHeader(http.StatusOK)
		_, _ = w.Write([]byte("ok"))
	})

	r.Route("/api/v1", func(api chi.Router) {
		api.Route("/auth", func(ar chi.Router) {
			ar.Post("/register", authHandler.Register)
			ar.Post("/login", authHandler.Login)
			ar.Post("/refresh", authHandler.Refresh)
		})

		api.Group(func(pr chi.Router) {
			pr.Use(middleware.Authenticate(tokens))

			pr.Route("/vehicles", func(vr chi.Router) {
				vr.Get("/", vehicleHandler.List)
				vr.Post("/", vehicleHandler.Create)
				vr.Get("/{id}", vehicleHandler.Get)
				vr.Put("/{id}", vehicleHandler.Update)
				vr.Delete("/{id}", vehicleHandler.Delete)
				vr.Post("/{id}/default", vehicleHandler.SetDefault)
			})

			pr.Route("/fuel", func(fr chi.Router) {
				fr.Get("/current", fuelHandler.GetCurrent)
				fr.Put("/current", fuelHandler.PutCurrent)
				fr.Post("/transactions", fuelHandler.CreateTransaction)
				fr.Get("/transactions", fuelHandler.ListTransactions)
			})

			pr.Route("/trips", func(tr chi.Router) {
				tr.Post("/calculate", tripHandler.Calculate)
				tr.Post("/", tripHandler.Create)
				tr.Get("/", tripHandler.List)
				tr.Get("/{id}", tripHandler.Get)
				tr.Post("/{id}/start", tripHandler.Start)
				tr.Post("/{id}/end", tripHandler.End)
			})
		})
	})

	srv := &http.Server{
		Addr:         ":" + cfg.Port,
		Handler:      r,
		ReadTimeout:  15 * time.Second,
		WriteTimeout: 15 * time.Second,
		IdleTimeout:  60 * time.Second,
	}

	go func() {
		log.Printf("API listening on :%s", cfg.Port)
		if err := srv.ListenAndServe(); err != nil && err != http.ErrServerClosed {
			log.Fatalf("server: %v", err)
		}
	}()

	stop := make(chan os.Signal, 1)
	signal.Notify(stop, syscall.SIGINT, syscall.SIGTERM)
	<-stop

	shutdownCtx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()
	_ = srv.Shutdown(shutdownCtx)
}
