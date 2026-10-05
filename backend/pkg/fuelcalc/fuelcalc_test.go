package fuelcalc_test

import (
	"math"
	"testing"

	"github.com/fuel-planner/backend/pkg/fuelcalc"
)

func TestCalculateFuelFromPercentage_DemoVehicle(t *testing.T) {
	got := fuelcalc.CalculateFuelFromPercentage(50, 60)
	if math.Abs(got-30) > 0.001 {
		t.Fatalf("expected 30 L, got %v", got)
	}
}

func TestCalculateFuelRequired_DemoTrip(t *testing.T) {
	got := fuelcalc.CalculateFuelRequired(490, 7.5)
	if math.Abs(got-36.75) > 0.001 {
		t.Fatalf("expected 36.75 L, got %v", got)
	}
}

func TestAssessTripFuel_Insufficient(t *testing.T) {
	a := fuelcalc.AssessTripFuel(490, 7.5, 30, 50)
	if a.Status != fuelcalc.StatusNotEnoughFuel {
		t.Fatalf("expected insufficient, got %s", a.Status)
	}
	if math.Abs(a.ShortageLiters-6.75) > 0.01 {
		t.Fatalf("expected shortage 6.75, got %v", a.ShortageLiters)
	}
}

func TestCalculateRoundTripDistance(t *testing.T) {
	got := fuelcalc.CalculateRoundTripDistance(245, 245)
	if got != 490 {
		t.Fatalf("expected 490, got %v", got)
	}
}

func TestCalculateAdditionalRange(t *testing.T) {
	// 10,000 FCFA at 875 FCFA/L ≈ 11.43 L → range at 7.5 L/100km ≈ 152 km
	rangeKm := fuelcalc.CalculateAdditionalRange(10000, 875, 7.5)
	if rangeKm < 151 || rangeKm > 153 {
		t.Fatalf("expected ~152 km, got %v", rangeKm)
	}
}
