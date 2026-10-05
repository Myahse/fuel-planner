package fuelcalc

import "math"

// CalculateFuelRequired returns liters needed for a distance at given consumption (L/100km).
func CalculateFuelRequired(distanceKm, consumptionLPer100Km float64) float64 {
	if distanceKm <= 0 || consumptionLPer100Km <= 0 {
		return 0
	}
	return distanceKm * consumptionLPer100Km / 100
}

// CalculateFuelCost returns total cost for fuel volume at price per liter.
func CalculateFuelCost(fuelRequiredLiters, pricePerLiter float64) float64 {
	if fuelRequiredLiters <= 0 || pricePerLiter <= 0 {
		return 0
	}
	return fuelRequiredLiters * pricePerLiter
}

// CalculateRange returns estimated driving range in km.
func CalculateRange(fuelLiters, consumptionLPer100Km float64) float64 {
	if fuelLiters <= 0 || consumptionLPer100Km <= 0 {
		return 0
	}
	return fuelLiters * 100 / consumptionLPer100Km
}

// CalculateFuelFromPercentage returns estimated liters from tank capacity and percentage.
func CalculateFuelFromPercentage(tankCapacityLiters, percentage float64) float64 {
	if tankCapacityLiters <= 0 || percentage <= 0 {
		return 0
	}
	return tankCapacityLiters * percentage / 100
}

// CalculatePercentage returns fuel percentage from liters and tank capacity.
func CalculatePercentage(fuelLiters, tankCapacityLiters float64) float64 {
	if tankCapacityLiters <= 0 {
		return 0
	}
	p := fuelLiters / tankCapacityLiters * 100
	return math.Min(100, math.Max(0, p))
}

// CalculateLitersFromAmount returns liters purchasable for a monetary amount.
func CalculateLitersFromAmount(amount, pricePerLiter float64) float64 {
	if amount <= 0 || pricePerLiter <= 0 {
		return 0
	}
	return amount / pricePerLiter
}

// CalculateAdditionalRange returns extra range from spending a given amount on fuel.
func CalculateAdditionalRange(amount, fuelPrice, consumptionLPer100Km float64) float64 {
	liters := CalculateLitersFromAmount(amount, fuelPrice)
	return CalculateRange(liters, consumptionLPer100Km)
}

// CalculateRoundTripDistance sums outbound and return leg distances.
func CalculateRoundTripDistance(outboundKm, returnKm float64) float64 {
	return outboundKm + returnKm
}

// TripFuelStatus classifies whether a trip is feasible with current fuel.
type TripFuelStatus string

const (
	StatusEnoughFuel    TripFuelStatus = "enough"
	StatusLowFuel       TripFuelStatus = "low"
	StatusNotEnoughFuel TripFuelStatus = "insufficient"
)

// LowFuelThresholdLiters is remaining fuel below which a trip is "low fuel" but still possible.
const LowFuelThresholdLiters = 5.0

// TripFuelAssessment contains fuel feasibility for a trip.
type TripFuelAssessment struct {
	Status            TripFuelStatus `json:"status"`
	FuelRequired      float64        `json:"fuel_required"`
	StartingFuel      float64        `json:"starting_fuel"`
	RemainingFuel     float64        `json:"remaining_fuel"`
	RemainingRangeKm  float64        `json:"remaining_range_km"`
	ShortageLiters    float64        `json:"shortage_liters,omitempty"`
	RecommendedRefuel float64        `json:"recommended_refuel,omitempty"`
}

// AssessTripFuel evaluates trip fuel needs against available estimated fuel.
func AssessTripFuel(distanceKm, consumption, startingFuelLiters, tankCapacity float64) TripFuelAssessment {
	required := CalculateFuelRequired(distanceKm, consumption)
	remaining := startingFuelLiters - required
	rangeKm := CalculateRange(remaining, consumption)

	result := TripFuelAssessment{
		FuelRequired:     round3(required),
		StartingFuel:     round3(startingFuelLiters),
		RemainingFuel:    round3(remaining),
		RemainingRangeKm: round2(rangeKm),
	}

	if remaining < 0 {
		result.Status = StatusNotEnoughFuel
		result.ShortageLiters = round3(-remaining)
		result.RecommendedRefuel = round3(recommendRefuelLiters(-remaining, tankCapacity, startingFuelLiters))
		return result
	}

	if remaining <= LowFuelThresholdLiters {
		result.Status = StatusLowFuel
		return result
	}

	result.Status = StatusEnoughFuel
	return result
}

func recommendRefuelLiters(shortage, tankCapacity, currentFuel float64) float64 {
	// Round up to nearest 5 L, minimum 10 L top-up suggestion.
	need := shortage + LowFuelThresholdLiters
	suggested := math.Ceil(need/5) * 5
	if suggested < 10 {
		suggested = 10
	}
	maxAdd := tankCapacity - currentFuel
	if maxAdd > 0 && suggested > maxAdd {
		suggested = math.Ceil(maxAdd)
	}
	return suggested
}

func round2(v float64) float64 {
	return math.Round(v*100) / 100
}

func round3(v float64) float64 {
	return math.Round(v*1000) / 1000
}
