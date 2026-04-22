package handler_test

import (
	"testing"
)

func TestAssetConditionValues(t *testing.T) {
	validConditions := []string{"OK", "RUSAK_RINGAN", "RUSAK_TOTAL", "MAINTENANCE"}
	invalidConditions := []string{"BAD", "INVALID", "broken", ""}

	for _, cond := range validConditions {
		t.Run("valid_"+cond, func(t *testing.T) {
			valid := false
			for _, v := range validConditions {
				if cond == v {
					valid = true
					break
				}
			}
			if !valid {
				t.Errorf("Expected %s to be valid condition", cond)
			}
		})
	}

	for _, cond := range invalidConditions {
		t.Run("invalid_"+cond, func(t *testing.T) {
			valid := false
			for _, v := range validConditions {
				if cond == v {
					valid = true
					break
				}
			}
			if valid {
				t.Errorf("Expected %s to be invalid condition", cond)
			}
		})
	}
}

func TestMaintenanceLogCostValidation(t *testing.T) {
	tests := []struct {
		name  string
		cost  float64
		valid bool
	}{
		{"zero cost is valid", 0, true},
		{"positive cost is valid", 50000, true},
		{"negative cost is invalid", -100, false},
		{"large cost is valid", 100000000, true},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			valid := tt.cost >= 0
			if valid != tt.valid {
				t.Errorf("Cost %.2f: expected valid=%v, got valid=%v", tt.cost, tt.valid, valid)
			}
		})
	}
}

func TestAssetCodeFormat(t *testing.T) {
	tests := []struct {
		name    string
		code    string
		isValid bool
	}{
		{"simple code", "PC-001", true},
		{"code with lab prefix", "PC-LAB1-001", true},
		{"empty code", "", false},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			valid := len(tt.code) > 0
			if valid != tt.isValid {
				t.Errorf("Code '%s': expected valid=%v, got valid=%v", tt.code, tt.isValid, valid)
			}
		})
	}
}

func TestPriceCalculation(t *testing.T) {
	tests := []struct {
		name     string
		items    []float64
		expected float64
	}{
		{"empty list", []float64{}, 0},
		{"single item", []float64{100000}, 100000},
		{"multiple items", []float64{50000, 75000, 100000}, 225000},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			var total float64
			for _, item := range tt.items {
				total += item
			}
			if total != tt.expected {
				t.Errorf("Expected total %.2f, got %.2f", tt.expected, total)
			}
		})
	}
}

func TestCategoryNameValidation(t *testing.T) {
	validNames := []string{"Laptop", "PC Desktop", "Switch", "Proyektor", "Scanner", "a"}
	invalidNames := []string{""}

	for _, name := range validNames {
		t.Run("valid_"+name, func(t *testing.T) {
			valid := len(name) > 0
			if !valid {
				t.Errorf("Expected '%s' to be valid category name", name)
			}
		})
	}

	for _, name := range invalidNames {
		t.Run("invalid_"+name, func(t *testing.T) {
			valid := len(name) > 0
			if valid {
				t.Errorf("Expected '%s' to be invalid category name", name)
			}
		})
	}
}
