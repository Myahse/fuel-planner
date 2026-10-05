package trips

import (
	"context"
	"strings"

	"github.com/fuel-planner/backend/internal/maps"
	"github.com/fuel-planner/backend/internal/vehicles"
	"github.com/fuel-planner/backend/pkg/fuelcalc"
)

func consumptionForProfile(v *vehicles.Vehicle, profile string) float64 {
	switch strings.ToLower(profile) {
	case "city":
		if v.CityConsumption != nil && *v.CityConsumption > 0 {
			return *v.CityConsumption
		}
	case "highway":
		if v.HighwayConsumption != nil && *v.HighwayConsumption > 0 {
			return *v.HighwayConsumption
		}
	}
	return v.MixedConsumption
}

func durationMultiplier(tripType string) int {
	if tripType == "round_trip" {
		return 2
	}
	return 1
}

type TripInput struct {
	VehicleID          string
	Origin             string
	Destination        string
	TripType           string
	ConsumptionProfile string
	FuelPricePerLiter  float64
}

type TripComputation struct {
	OriginLabel              string
	DestinationLabel         string
	OriginLat                float64
	OriginLng                float64
	DestLat                  float64
	DestLng                  float64
	TripType                 string
	DistanceKm               float64
	EstimatedDurationSeconds int
	FuelRequiredLiters       float64
	EstimatedFuelCost        float64
	StartingFuelPercentage   float64
	StartingFuelLitersEst    float64
	ConsumptionLPer100       float64
	Assessment               fuelcalc.TripFuelAssessment
	MapProvider              string
	FuelPricePerLiter        float64
}

func ComputeTrip(ctx context.Context, mapProvider maps.MapProvider, v *vehicles.Vehicle, in TripInput) (*TripComputation, error) {
	originPlaces, err := mapProvider.Geocode(ctx, in.Origin)
	if err != nil || len(originPlaces) == 0 {
		return nil, errGeocodeOrigin
	}
	destPlaces, err := mapProvider.Geocode(ctx, in.Destination)
	if err != nil || len(destPlaces) == 0 {
		return nil, errGeocodeDestination
	}

	route, err := mapProvider.GetRoute(ctx, maps.RouteRequest{
		Origin:      originPlaces[0],
		Destination: destPlaces[0],
		Profile:     "fastest",
	})
	if err != nil {
		return nil, err
	}

	tripType := strings.ToLower(in.TripType)
	if tripType == "" {
		tripType = "one_way"
	}
	distance := route.DistanceKm
	if tripType == "round_trip" {
		distance = fuelcalc.CalculateRoundTripDistance(route.OutboundDistanceKm, route.ReturnDistanceKm)
	}

	consumption := consumptionForProfile(v, in.ConsumptionProfile)
	startPct := 0.0
	if v.FuelPercentage != nil {
		startPct = *v.FuelPercentage
	}
	startFuel := fuelcalc.CalculateFuelFromPercentage(v.TankCapacityLiters, startPct)
	fuelRequired := fuelcalc.CalculateFuelRequired(distance, consumption)

	price := in.FuelPricePerLiter
	if price <= 0 {
		price = 875
	}

	assessment := fuelcalc.AssessTripFuel(distance, consumption, startFuel, v.TankCapacityLiters)

	return &TripComputation{
		OriginLabel:              originPlaces[0].Label,
		DestinationLabel:         destPlaces[0].Label,
		OriginLat:                originPlaces[0].Lat,
		OriginLng:                originPlaces[0].Lng,
		DestLat:                  destPlaces[0].Lat,
		DestLng:                  destPlaces[0].Lng,
		TripType:                 tripType,
		DistanceKm:               distance,
		EstimatedDurationSeconds: route.DurationSeconds * durationMultiplier(tripType),
		FuelRequiredLiters:       fuelRequired,
		EstimatedFuelCost:        fuelcalc.CalculateFuelCost(fuelRequired, price),
		StartingFuelPercentage:   startPct,
		StartingFuelLitersEst:    startFuel,
		ConsumptionLPer100:       consumption,
		Assessment:               assessment,
		MapProvider:              route.Provider,
		FuelPricePerLiter:        price,
	}, nil
}

var (
	errGeocodeOrigin      = errTrip("could not geocode origin")
	errGeocodeDestination = errTrip("could not geocode destination")
)

type tripError string

func (e tripError) Error() string { return string(e) }

func errTrip(s string) error { return tripError(s) }
