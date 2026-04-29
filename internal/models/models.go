package models

import (
	"encoding/json"
	"time"
)

type Category struct {
	ID        int64     `json:"id"`
	Name      string    `json:"name"`
	CreatedAt time.Time `json:"created_at"`
}

type BudgetSource struct {
	ID        int64     `json:"id"`
	Name      string    `json:"name"`
	CreatedAt time.Time `json:"created_at"`
}

type Location struct {
	ID        int64     `json:"id"`
	Name      string    `json:"name"`
	CreatedAt time.Time `json:"created_at"`
}

type Asset struct {
	ID              int64           `json:"id"`
	CategoryID      *int64          `json:"category_id"`
	BudgetSourceID  *int64          `json:"budget_source_id"`
	LocationID      *int64          `json:"location_id"`
	Code            string          `json:"code"`
	Name            string          `json:"name"`
	Specification   string          `json:"specification"`
	Specifications  json.RawMessage `json:"specifications"`
	PhotoURL        string          `json:"photo_url"`
	Condition       string          `json:"condition"`
	PurchaseDate    *time.Time      `json:"purchase_date"`
	Price           *float64        `json:"price"`
	WarrantyExpiry  *time.Time      `json:"warranty_expiry"`
	UsefulLifeYears int             `json:"useful_life_years"`
	SalvageValue    float64         `json:"salvage_value"`
	CreatedAt       time.Time       `json:"created_at"`
	UpdatedAt       time.Time       `json:"updated_at"`
}

type MaintenanceLog struct {
	ID             int64     `json:"id"`
	AssetID        int64     `json:"asset_id"`
	ActionDate     time.Time `json:"action_date"`
	Description    string    `json:"description"`
	TechnicianName string    `json:"technician_name"`
	Cost           float64   `json:"cost"`
}

type MaintenanceLogWithAsset struct {
	ID             int64     `json:"id"`
	AssetID        int64     `json:"asset_id"`
	AssetCode      string    `json:"asset_code"`
	AssetName      string    `json:"asset_name"`
	ActionDate     time.Time `json:"action_date"`
	Description    string    `json:"description"`
	TechnicianName string    `json:"technician_name"`
	Cost           float64   `json:"cost"`
}

type UpgradeLog struct {
	ID          int64     `json:"id"`
	AssetID     int64     `json:"asset_id"`
	UpgradeDate time.Time `json:"upgrade_date"`
	Description string    `json:"description"`
}
