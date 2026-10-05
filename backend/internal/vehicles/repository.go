package vehicles

import (
	"context"
	"fmt"

	"github.com/fuel-planner/backend/pkg/fuelcalc"
	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"
)

type Repository struct {
	db *pgxpool.Pool
}

func NewRepository(db *pgxpool.Pool) *Repository {
	return &Repository{db: db}
}

func (r *Repository) ListByUser(ctx context.Context, userID string) ([]Vehicle, error) {
	rows, err := r.db.Query(ctx, `
		SELECT v.id, v.user_id, v.make, v.model, v.year, v.engine, v.fuel_type::text,
			v.tank_capacity_liters, v.city_consumption, v.highway_consumption, v.mixed_consumption,
			v.fuel_gauge_bars, v.is_default, v.paint_color, v.model_3d_url, v.body_style,
			fl.fuel_percentage, v.created_at, v.updated_at
		FROM vehicles v
		LEFT JOIN fuel_levels fl ON fl.vehicle_id = v.id
		WHERE v.user_id = $1
		ORDER BY v.is_default DESC, v.created_at ASC
	`, userID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var list []Vehicle
	for rows.Next() {
		v, err := scanVehicle(rows)
		if err != nil {
			return nil, err
		}
		list = append(list, v)
	}
	return list, rows.Err()
}

func (r *Repository) GetByID(ctx context.Context, userID, vehicleID string) (*Vehicle, error) {
	row := r.db.QueryRow(ctx, `
		SELECT v.id, v.user_id, v.make, v.model, v.year, v.engine, v.fuel_type::text,
			v.tank_capacity_liters, v.city_consumption, v.highway_consumption, v.mixed_consumption,
			v.fuel_gauge_bars, v.is_default, v.paint_color, v.model_3d_url, v.body_style,
			fl.fuel_percentage, v.created_at, v.updated_at
		FROM vehicles v
		LEFT JOIN fuel_levels fl ON fl.vehicle_id = v.id
		WHERE v.id = $1 AND v.user_id = $2
	`, vehicleID, userID)
	v, err := scanVehicleRow(row)
	if err != nil {
		if err == pgx.ErrNoRows {
			return nil, fmt.Errorf("not found")
		}
		return nil, err
	}
	return &v, nil
}

func (r *Repository) Create(ctx context.Context, userID string, in CreateVehicleInput) (*Vehicle, error) {
	tx, err := r.db.Begin(ctx)
	if err != nil {
		return nil, err
	}
	defer tx.Rollback(ctx)

	var existingCount int
	if err := tx.QueryRow(ctx, `SELECT COUNT(*) FROM vehicles WHERE user_id = $1`, userID).Scan(&existingCount); err != nil {
		return nil, err
	}
	isDefault := in.IsDefault || existingCount == 0
	if isDefault {
		if _, err := tx.Exec(ctx, `UPDATE vehicles SET is_default = FALSE WHERE user_id = $1`, userID); err != nil {
			return nil, err
		}
	}

	bars := in.FuelGaugeBars
	if bars == 0 {
		bars = 10
	}

	var v Vehicle
	err = tx.QueryRow(ctx, `
		INSERT INTO vehicles (
			user_id, make, model, year, engine, fuel_type, tank_capacity_liters,
			city_consumption, highway_consumption, mixed_consumption, fuel_gauge_bars, is_default,
			paint_color, model_3d_url, body_style
		) VALUES (
			$1, $2, $3, $4, $5, $6::fuel_type, $7, $8, $9, $10, $11, $12, $13, $14, $15
		)
		RETURNING id, user_id, make, model, year, engine, fuel_type::text,
			tank_capacity_liters, city_consumption, highway_consumption, mixed_consumption,
			fuel_gauge_bars, is_default, paint_color, model_3d_url, body_style, created_at, updated_at
	`, userID, in.Make, in.Model, in.Year, in.Engine, in.FuelType, in.TankCapacityLiters,
		in.CityConsumption, in.HighwayConsumption, in.MixedConsumption, bars, isDefault,
		in.PaintColor, in.Model3DURL, in.BodyStyle,
	).Scan(
		&v.ID, &v.UserID, &v.Make, &v.Model, &v.Year, &v.Engine, &v.FuelType,
		&v.TankCapacityLiters, &v.CityConsumption, &v.HighwayConsumption, &v.MixedConsumption,
		&v.FuelGaugeBars, &v.IsDefault, &v.PaintColor, &v.Model3DURL, &v.BodyStyle, &v.CreatedAt, &v.UpdatedAt,
	)
	if err != nil {
		return nil, err
	}

	pct := 0.0
	if in.InitialFuelPercent != nil {
		pct = *in.InitialFuelPercent
	}
	_, err = tx.Exec(ctx, `
		INSERT INTO fuel_levels (user_id, vehicle_id, fuel_percentage)
		VALUES ($1, $2, $3)
	`, userID, v.ID, pct)
	if err != nil {
		return nil, err
	}
	v.FuelPercentage = &pct
	v.EstimatedFuelLiters = ptr(fuelcalc.CalculateFuelFromPercentage(v.TankCapacityLiters, pct))

	if err := tx.Commit(ctx); err != nil {
		return nil, err
	}
	return &v, nil
}

func (r *Repository) Update(ctx context.Context, userID, vehicleID string, in UpdateVehicleInput) (*Vehicle, error) {
	current, err := r.GetByID(ctx, userID, vehicleID)
	if err != nil {
		return nil, err
	}

	make := coalesceStr(in.Make, current.Make)
	model := coalesceStr(in.Model, current.Model)
	year := coalesceInt(in.Year, current.Year)
	engine := coalesceStr(in.Engine, current.Engine)
	fuelType := coalesceStr(in.FuelType, current.FuelType)
	tank := coalesceFloat(in.TankCapacityLiters, current.TankCapacityLiters)
	mixed := coalesceFloat(in.MixedConsumption, current.MixedConsumption)
	bars := coalesceInt(in.FuelGaugeBars, current.FuelGaugeBars)
	paint := current.PaintColor
	if in.PaintColor != nil {
		paint = in.PaintColor
	}
	modelURL := current.Model3DURL
	if in.Model3DURL != nil {
		modelURL = in.Model3DURL
	}
	bodyStyle := current.BodyStyle
	if in.BodyStyle != nil {
		bodyStyle = in.BodyStyle
	}

	city := current.CityConsumption
	if in.CityConsumption != nil {
		city = in.CityConsumption
	}
	highway := current.HighwayConsumption
	if in.HighwayConsumption != nil {
		highway = in.HighwayConsumption
	}

	err = r.db.QueryRow(ctx, `
		UPDATE vehicles SET
			make = $3, model = $4, year = $5, engine = $6, fuel_type = $7::fuel_type,
			tank_capacity_liters = $8, city_consumption = $9, highway_consumption = $10,
			mixed_consumption = $11, fuel_gauge_bars = $12,
			paint_color = $13, model_3d_url = $14, body_style = $15,
			updated_at = NOW()
		WHERE id = $1 AND user_id = $2
		RETURNING id
	`, vehicleID, userID, make, model, year, engine, fuelType, tank, city, highway, mixed, bars,
		paint, modelURL, bodyStyle).Scan(&vehicleID)
	if err != nil {
		return nil, err
	}
	return r.GetByID(ctx, userID, vehicleID)
}

func (r *Repository) Delete(ctx context.Context, userID, vehicleID string) error {
	tag, err := r.db.Exec(ctx, `DELETE FROM vehicles WHERE id = $1 AND user_id = $2`, vehicleID, userID)
	if err != nil {
		return err
	}
	if tag.RowsAffected() == 0 {
		return fmt.Errorf("not found")
	}
	return nil
}

func (r *Repository) SetDefault(ctx context.Context, userID, vehicleID string) error {
	tx, err := r.db.Begin(ctx)
	if err != nil {
		return err
	}
	defer tx.Rollback(ctx)

	if _, err := tx.Exec(ctx, `UPDATE vehicles SET is_default = FALSE WHERE user_id = $1`, userID); err != nil {
		return err
	}
	tag, err := tx.Exec(ctx, `UPDATE vehicles SET is_default = TRUE WHERE id = $1 AND user_id = $2`, vehicleID, userID)
	if err != nil {
		return err
	}
	if tag.RowsAffected() == 0 {
		return fmt.Errorf("not found")
	}
	return tx.Commit(ctx)
}

func scanVehicle(rows pgx.Rows) (Vehicle, error) {
	var v Vehicle
	var pct *float64
	err := rows.Scan(
		&v.ID, &v.UserID, &v.Make, &v.Model, &v.Year, &v.Engine, &v.FuelType,
		&v.TankCapacityLiters, &v.CityConsumption, &v.HighwayConsumption, &v.MixedConsumption,
		&v.FuelGaugeBars, &v.IsDefault, &v.PaintColor, &v.Model3DURL, &v.BodyStyle,
		&pct, &v.CreatedAt, &v.UpdatedAt,
	)
	if err != nil {
		return v, err
	}
	if pct != nil {
		v.FuelPercentage = pct
		v.EstimatedFuelLiters = ptr(fuelcalc.CalculateFuelFromPercentage(v.TankCapacityLiters, *pct))
	}
	return v, nil
}

func scanVehicleRow(row pgx.Row) (Vehicle, error) {
	var v Vehicle
	var pct *float64
	err := row.Scan(
		&v.ID, &v.UserID, &v.Make, &v.Model, &v.Year, &v.Engine, &v.FuelType,
		&v.TankCapacityLiters, &v.CityConsumption, &v.HighwayConsumption, &v.MixedConsumption,
		&v.FuelGaugeBars, &v.IsDefault, &v.PaintColor, &v.Model3DURL, &v.BodyStyle,
		&pct, &v.CreatedAt, &v.UpdatedAt,
	)
	if err != nil {
		return v, err
	}
	if pct != nil {
		v.FuelPercentage = pct
		v.EstimatedFuelLiters = ptr(fuelcalc.CalculateFuelFromPercentage(v.TankCapacityLiters, *pct))
	}
	return v, nil
}

func ptr(f float64) *float64 { return &f }

func coalesceStr(v *string, fallback string) string {
	if v != nil {
		return *v
	}
	return fallback
}

func coalesceInt(v *int, fallback int) int {
	if v != nil {
		return *v
	}
	return fallback
}

func coalesceFloat(v *float64, fallback float64) float64 {
	if v != nil {
		return *v
	}
	return fallback
}
