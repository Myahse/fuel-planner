package maps

import "testing"

func TestIsFuelSearchboxPOI_acceptsBrandFeatureType(t *testing.T) {
	if !isFuelSearchboxPOI("brand", []string{"retail"}, "Total Energies") {
		t.Fatal("expected brand feature with fuel name to pass")
	}
}

func TestIsFuelSearchboxPOI_rejectsBusStation(t *testing.T) {
	if isFuelSearchboxPOI("poi", nil, "Gare routière") {
		t.Fatal("expected bus station to be rejected")
	}
}
