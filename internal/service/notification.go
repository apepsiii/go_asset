package service

import (
	"database/sql"
	"time"

	"lab-asset-manager/internal/models"
	"lab-asset-manager/internal/repository"
)

type WarrantyAlert struct {
	Asset         models.Asset `json:"asset"`
	DaysRemaining int          `json:"days_remaining"`
}

func GetWarrantyExpiringSoon(daysThreshold int) ([]WarrantyAlert, error) {
	if daysThreshold <= 0 {
		daysThreshold = 30
	}

	threshold := time.Now().AddDate(0, 0, daysThreshold).Format("2006-01-02")

	rows, err := repository.DB.Query(`
		SELECT id, category_id, budget_source_id, location_id, code, name,
		       specification, photo_url, condition, purchase_date, price,
		       warranty_expiry, created_at, updated_at
		FROM assets
		WHERE warranty_expiry IS NOT NULL
		  AND warranty_expiry <= ?
		  AND condition != 'RUSAK_TOTAL'
		ORDER BY warranty_expiry ASC
	`, threshold)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var alerts []WarrantyAlert
	for rows.Next() {
		a, err := scanAsset(rows)
		if err != nil {
			continue
		}
		if a.WarrantyExpiry != nil {
			daysLeft := int(time.Until(*a.WarrantyExpiry).Hours() / 24)
			alerts = append(alerts, WarrantyAlert{Asset: *a, DaysRemaining: daysLeft})
		}
	}
	if alerts == nil {
		alerts = []WarrantyAlert{}
	}
	return alerts, nil
}

type BrokenAssetAlert struct {
	Asset            models.Asset `json:"asset"`
	MaintenanceCount int          `json:"maintenance_count"`
	LastMaintenance  *time.Time   `json:"last_maintenance"`
}

func GetBrokenAssetsNeedingAttention() ([]BrokenAssetAlert, error) {
	rows, err := repository.DB.Query(`
		SELECT a.id, a.category_id, a.budget_source_id, a.location_id, a.code, a.name,
		       a.specification, a.photo_url, a.condition, a.purchase_date, a.price,
		       a.warranty_expiry, a.created_at, a.updated_at,
		       COALESCE(m.cnt, 0) as maintenance_count,
		       m.last_date as last_maintenance_date
		FROM assets a
		LEFT JOIN (
			SELECT asset_id, COUNT(*) as cnt, MAX(action_date) as last_date
			FROM maintenance_logs
			GROUP BY asset_id
		) m ON m.asset_id = a.id
		WHERE a.condition IN ('RUSAK_RINGAN', 'RUSAK_TOTAL', 'MAINTENANCE')
		ORDER BY a.condition ASC, m.last_date ASC NULLS FIRST
	`)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var alerts []BrokenAssetAlert
	for rows.Next() {
		var a models.Asset
		var maintenanceCount int
		var lastMaintenance sql.NullTime
		var purchaseDate, warrantyExpiry sql.NullTime
		var spec, photoURL sql.NullString

		err := rows.Scan(
			&a.ID, &a.CategoryID, &a.BudgetSourceID, &a.LocationID,
			&a.Code, &a.Name, &spec, &photoURL, &a.Condition,
			&purchaseDate, &a.Price, &warrantyExpiry, &a.CreatedAt, &a.UpdatedAt,
			&maintenanceCount, &lastMaintenance,
		)
		if err != nil {
			continue
		}
		if spec.Valid {
			a.Specification = spec.String
		}
		if photoURL.Valid {
			a.PhotoURL = photoURL.String
		}
		if purchaseDate.Valid {
			a.PurchaseDate = &purchaseDate.Time
		}
		if warrantyExpiry.Valid {
			a.WarrantyExpiry = &warrantyExpiry.Time
		}

		alert := BrokenAssetAlert{
			Asset:            a,
			MaintenanceCount: maintenanceCount,
		}
		if lastMaintenance.Valid {
			alert.LastMaintenance = &lastMaintenance.Time
		}
		alerts = append(alerts, alert)
	}
	if alerts == nil {
		alerts = []BrokenAssetAlert{}
	}
	return alerts, nil
}

type NotificationSummary struct {
	WarrantyExpiring []WarrantyAlert    `json:"warranty_expiring"`
	BrokenAssets     []BrokenAssetAlert `json:"broken_assets"`
	TotalOK          int                `json:"total_ok"`
	TotalBroken      int                `json:"total_broken"`
}

func GetNotificationSummary(warrantyDaysThreshold int) (*NotificationSummary, error) {
	warrantyAlerts, err := GetWarrantyExpiringSoon(warrantyDaysThreshold)
	if err != nil {
		return nil, err
	}

	brokenAlerts, err := GetBrokenAssetsNeedingAttention()
	if err != nil {
		return nil, err
	}

	var totalOK, totalBroken int
	repository.DB.QueryRow("SELECT COUNT(*) FROM assets WHERE condition = 'OK'").Scan(&totalOK)
	repository.DB.QueryRow("SELECT COUNT(*) FROM assets WHERE condition IN ('RUSAK_RINGAN', 'RUSAK_TOTAL', 'MAINTENANCE')").Scan(&totalBroken)

	return &NotificationSummary{
		WarrantyExpiring: warrantyAlerts,
		BrokenAssets:     brokenAlerts,
		TotalOK:          totalOK,
		TotalBroken:      totalBroken,
	}, nil
}
