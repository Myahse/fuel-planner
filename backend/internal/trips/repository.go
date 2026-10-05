package trips

import (
	"context"
	"fmt"
	"time"

	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"
)

type Trip struct {
	ID                       string     `json:"id"`
	UserID                   string     `json:"user_id"`
	VehicleID                string     `json:"vehicle_id"`
	OriginLabel              string     `json:"origin"`
	DestinationLabel         string     `json:"destination"`
	DistanceKm               float64    `json:"distance_km"`
	EstimatedDurationSeconds int        `json:"estimated_duration_seconds"`
	FuelRequiredLiters       float64    `json:"fuel_required_liters"`
	FuelCost                 float64    `json:"fuel_cost"`
	StartingFuelPercentage   float64    `json:"starting_fuel_percentage"`
	StartingFuelLitersEst    float64    `json:"starting_fuel_liters_est"`
	EndingFuelLitersEst      *float64   `json:"ending_fuel_liters_est,omitempty"`
	TripType                 string     `json:"trip_type"`
	Status                   string     `json:"status"`
	ConsumptionProfile       string     `json:"consumption_profile"`
	StartedAt                *time.Time `json:"started_at,omitempty"`
	CompletedAt              *time.Time `json:"completed_at,omitempty"`
	CreatedAt                time.Time  `json:"created_at"`
}

type Repository struct {
	db *pgxpool.Pool
}

func NewRepository(db *pgxpool.Pool) *Repository {
	return &Repository{db: db}
}

func (r *Repository) Create(ctx context.Context, userID, vehicleID string, comp *TripComputation, profile string) (*Trip, error) {
	var t Trip
	err := r.db.QueryRow(ctx, `
		INSERT INTO trips (
			user_id, vehicle_id, origin_label, destination_label,
			origin_lat, origin_lng, destination_lat, destination_lng,
			distance_km, estimated_duration_seconds, fuel_required_liters, fuel_cost,
			starting_fuel_percentage, starting_fuel_liters_est, trip_type, status, consumption_profile
		) VALUES (
			$1, $2, $3, $4, $5, $6, $7, $8,
			$9, $10, $11, $12, $13, $14, $15::trip_type, 'planned', $16
		)
		RETURNING id, user_id, vehicle_id, origin_label, destination_label,
			distance_km, estimated_duration_seconds, fuel_required_liters, fuel_cost,
			starting_fuel_percentage, starting_fuel_liters_est, ending_fuel_liters_est,
			trip_type::text, status::text, consumption_profile, started_at, completed_at, created_at
	`, userID, vehicleID, comp.OriginLabel, comp.DestinationLabel,
		comp.OriginLat, comp.OriginLng, comp.DestLat, comp.DestLng,
		comp.DistanceKm, comp.EstimatedDurationSeconds, comp.FuelRequiredLiters, comp.EstimatedFuelCost,
		comp.StartingFuelPercentage, comp.StartingFuelLitersEst, comp.TripType, profile,
	).Scan(
		&t.ID, &t.UserID, &t.VehicleID, &t.OriginLabel, &t.DestinationLabel,
		&t.DistanceKm, &t.EstimatedDurationSeconds, &t.FuelRequiredLiters, &t.FuelCost,
		&t.StartingFuelPercentage, &t.StartingFuelLitersEst, &t.EndingFuelLitersEst,
		&t.TripType, &t.Status, &t.ConsumptionProfile, &t.StartedAt, &t.CompletedAt, &t.CreatedAt,
	)
	if err != nil {
		return nil, err
	}
	return &t, nil
}

func (r *Repository) ListByUser(ctx context.Context, userID string, limit int) ([]Trip, error) {
	if limit <= 0 {
		limit = 50
	}
	rows, err := r.db.Query(ctx, `
		SELECT id, user_id, vehicle_id, origin_label, destination_label,
			distance_km, estimated_duration_seconds, fuel_required_liters, fuel_cost,
			starting_fuel_percentage, starting_fuel_liters_est, ending_fuel_liters_est,
			trip_type::text, status::text, consumption_profile, started_at, completed_at, created_at
		FROM trips WHERE user_id = $1
		ORDER BY created_at DESC LIMIT $2
	`, userID, limit)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	return scanTrips(rows)
}

func (r *Repository) GetByID(ctx context.Context, userID, tripID string) (*Trip, error) {
	row := r.db.QueryRow(ctx, `
		SELECT id, user_id, vehicle_id, origin_label, destination_label,
			distance_km, estimated_duration_seconds, fuel_required_liters, fuel_cost,
			starting_fuel_percentage, starting_fuel_liters_est, ending_fuel_liters_est,
			trip_type::text, status::text, consumption_profile, started_at, completed_at, created_at
		FROM trips WHERE id = $1 AND user_id = $2
	`, tripID, userID)
	t, err := scanTripRow(row)
	if err != nil {
		if err == pgx.ErrNoRows {
			return nil, fmt.Errorf("not found")
		}
		return nil, err
	}
	return &t, nil
}

func (r *Repository) Start(ctx context.Context, userID, tripID string) (*Trip, error) {
	tag, err := r.db.Exec(ctx, `
		UPDATE trips SET status = 'active', started_at = NOW(), updated_at = NOW()
		WHERE id = $1 AND user_id = $2 AND status = 'planned'
	`, tripID, userID)
	if err != nil {
		return nil, err
	}
	if tag.RowsAffected() == 0 {
		return nil, fmt.Errorf("not found or not planned")
	}
	return r.GetByID(ctx, userID, tripID)
}

func (r *Repository) End(ctx context.Context, userID, tripID string, endingFuelEst float64) (*Trip, error) {
	tag, err := r.db.Exec(ctx, `
		UPDATE trips SET
			status = 'completed',
			ending_fuel_liters_est = $3,
			completed_at = NOW(),
			updated_at = NOW()
		WHERE id = $1 AND user_id = $2 AND status = 'active'
	`, tripID, userID, endingFuelEst)
	if err != nil {
		return nil, err
	}
	if tag.RowsAffected() == 0 {
		return nil, fmt.Errorf("not found or not active")
	}
	return r.GetByID(ctx, userID, tripID)
}

func scanTrips(rows pgx.Rows) ([]Trip, error) {
	var list []Trip
	for rows.Next() {
		t, err := scanTripRows(rows)
		if err != nil {
			return nil, err
		}
		list = append(list, t)
	}
	return list, rows.Err()
}

func scanTripRows(rows pgx.Rows) (Trip, error) {
	var t Trip
	err := rows.Scan(
		&t.ID, &t.UserID, &t.VehicleID, &t.OriginLabel, &t.DestinationLabel,
		&t.DistanceKm, &t.EstimatedDurationSeconds, &t.FuelRequiredLiters, &t.FuelCost,
		&t.StartingFuelPercentage, &t.StartingFuelLitersEst, &t.EndingFuelLitersEst,
		&t.TripType, &t.Status, &t.ConsumptionProfile, &t.StartedAt, &t.CompletedAt, &t.CreatedAt,
	)
	return t, err
}

func scanTripRow(row pgx.Row) (Trip, error) {
	var t Trip
	err := row.Scan(
		&t.ID, &t.UserID, &t.VehicleID, &t.OriginLabel, &t.DestinationLabel,
		&t.DistanceKm, &t.EstimatedDurationSeconds, &t.FuelRequiredLiters, &t.FuelCost,
		&t.StartingFuelPercentage, &t.StartingFuelLitersEst, &t.EndingFuelLitersEst,
		&t.TripType, &t.Status, &t.ConsumptionProfile, &t.StartedAt, &t.CompletedAt, &t.CreatedAt,
	)
	return t, err
}
