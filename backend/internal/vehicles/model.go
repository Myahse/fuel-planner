package vehicles

import "time"

type Vehicle struct {
	ID                  string    `json:"id"`
	UserID              string    `json:"user_id"`
	Make                string    `json:"make"`
	Model               string    `json:"model"`
	Year                int       `json:"year"`
	Engine              string    `json:"engine"`
	FuelType            string    `json:"fuel_type"`
	TankCapacityLiters  float64   `json:"tank_capacity_liters"`
	CityConsumption     *float64  `json:"city_consumption,omitempty"`
	HighwayConsumption  *float64  `json:"highway_consumption,omitempty"`
	MixedConsumption    float64   `json:"mixed_consumption"`
	FuelGaugeBars       int       `json:"fuel_gauge_bars"`
	IsDefault           bool      `json:"is_default"`
	PaintColor          *string   `json:"paint_color,omitempty"`
	Model3DURL          *string   `json:"model_3d_url,omitempty"`
	BodyStyle           *string   `json:"body_style,omitempty"`
	FuelPercentage      *float64  `json:"fuel_percentage,omitempty"`
	EstimatedFuelLiters *float64  `json:"estimated_fuel_liters,omitempty"`
	CreatedAt           time.Time `json:"created_at"`
	UpdatedAt           time.Time `json:"updated_at"`
}

type CreateVehicleInput struct {
	Make               string   `json:"make"`
	Model              string   `json:"model"`
	Year               int      `json:"year"`
	Engine             string   `json:"engine"`
	FuelType           string   `json:"fuel_type"`
	TankCapacityLiters float64  `json:"tank_capacity_liters"`
	CityConsumption    *float64 `json:"city_consumption"`
	HighwayConsumption *float64 `json:"highway_consumption"`
	MixedConsumption   float64  `json:"mixed_consumption"`
	FuelGaugeBars      int      `json:"fuel_gauge_bars"`
	InitialFuelPercent *float64 `json:"initial_fuel_percentage"`
	IsDefault          bool     `json:"is_default"`
	PaintColor         *string  `json:"paint_color"`
	Model3DURL         *string  `json:"model_3d_url"`
	BodyStyle          *string  `json:"body_style"`
}

type UpdateVehicleInput struct {
	Make               *string  `json:"make"`
	Model              *string  `json:"model"`
	Year               *int     `json:"year"`
	Engine             *string  `json:"engine"`
	FuelType           *string  `json:"fuel_type"`
	TankCapacityLiters *float64 `json:"tank_capacity_liters"`
	CityConsumption    *float64 `json:"city_consumption"`
	HighwayConsumption *float64 `json:"highway_consumption"`
	MixedConsumption   *float64 `json:"mixed_consumption"`
	FuelGaugeBars      *int     `json:"fuel_gauge_bars"`
	PaintColor         *string  `json:"paint_color"`
	Model3DURL         *string  `json:"model_3d_url"`
	BodyStyle          *string  `json:"body_style"`
}
