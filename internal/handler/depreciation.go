package handler

import (
	"database/sql"
	"math"
	"net/http"
	"time"

	"github.com/labstack/echo/v5"
	"lab-asset-manager/internal/models"
	"lab-asset-manager/internal/repository"
)

type DepreciationHandler struct{}

func NewDepreciationHandler() *DepreciationHandler {
	return &DepreciationHandler{}
}

type DepreciationInfo struct {
	AssetID                 int64   `json:"asset_id"`
	AssetCode               string  `json:"asset_code"`
	AssetName               string  `json:"asset_name"`
	PurchasePrice           float64 `json:"purchase_price"`
	CurrentValue            float64 `json:"current_value"`
	SalvageValue            float64 `json:"salvage_value"`
	UsefulLifeYears         int     `json:"useful_life_years"`
	AgeInYears              float64 `json:"age_in_years"`
	AnnualDepreciation      float64 `json:"annual_depreciation"`
	AccumulatedDepreciation float64 `json:"accumulated_depreciation"`
	RemainingLifeYears      float64 `json:"remaining_life_years"`
	Status                  string  `json:"status"` // "healthy", "depreciated", "fully_depreciated"
}

type DepreciationSummary struct {
	TotalAssets           int                `json:"total_assets"`
	TotalPurchaseValue    float64            `json:"total_purchase_value"`
	TotalCurrentValue     float64            `json:"total_current_value"`
	TotalDepreciation     float64            `json:"total_depreciation"`
	HealthyCount          int                `json:"healthy_count"`
	DepreciatedCount      int                `json:"depreciated_count"`
	FullyDepreciatedCount int                `json:"fully_depreciated_count"`
	Assets                []DepreciationInfo `json:"assets"`
}

func (h *DepreciationHandler) GetAssetDepreciation(c *echo.Context) error {
	assetID := c.Param("id")

	var asset models.Asset
	var purchaseDate, warrantyExpiry sql.NullTime
	var spec, photoURL sql.NullString
	var price, salvageValue sql.NullFloat64

	err := repository.DB.QueryRow(`
		SELECT id, category_id, budget_source_id, location_id, code, name,
		       specification, photo_url, condition, purchase_date, price,
		       warranty_expiry, useful_life_years, salvage_value, created_at, updated_at
		FROM assets WHERE id = ?
	`, assetID).Scan(
		&asset.ID, &asset.CategoryID, &asset.BudgetSourceID, &asset.LocationID,
		&asset.Code, &asset.Name, &spec, &photoURL, &asset.Condition,
		&purchaseDate, &price, &warrantyExpiry, &asset.UsefulLifeYears, &salvageValue,
		&asset.CreatedAt, &asset.UpdatedAt,
	)
	if err != nil {
		return c.JSON(http.StatusNotFound, map[string]string{"error": "Asset not found"})
	}

	if spec.Valid {
		asset.Specification = spec.String
	}
	if photoURL.Valid {
		asset.PhotoURL = photoURL.String
	}
	if purchaseDate.Valid {
		asset.PurchaseDate = &purchaseDate.Time
	}
	if warrantyExpiry.Valid {
		asset.WarrantyExpiry = &warrantyExpiry.Time
	}
	if price.Valid {
		asset.Price = &price.Float64
	}
	if salvageValue.Valid {
		asset.SalvageValue = salvageValue.Float64
	}

	info := calculateDepreciation(&asset)
	return c.JSON(http.StatusOK, info)
}

func (h *DepreciationHandler) GetAllDepreciations(c *echo.Context) error {
	rows, err := repository.DB.Query(`
		SELECT id, category_id, budget_source_id, location_id, code, name,
		       specification, photo_url, condition, purchase_date, price,
		       warranty_expiry, useful_life_years, salvage_value, created_at, updated_at
		FROM assets
		ORDER BY code
	`)
	if err != nil {
		return c.JSON(http.StatusInternalServerError, map[string]string{"error": err.Error()})
	}
	defer rows.Close()

	var assets []models.Asset
	for rows.Next() {
		var asset models.Asset
		var purchaseDate, warrantyExpiry sql.NullTime
		var spec, photoURL sql.NullString
		var price, salvageValue sql.NullFloat64

		err := rows.Scan(
			&asset.ID, &asset.CategoryID, &asset.BudgetSourceID, &asset.LocationID,
			&asset.Code, &asset.Name, &spec, &photoURL, &asset.Condition,
			&purchaseDate, &price, &warrantyExpiry, &asset.UsefulLifeYears, &salvageValue,
			&asset.CreatedAt, &asset.UpdatedAt,
		)
		if err != nil {
			continue
		}
		if spec.Valid {
			asset.Specification = spec.String
		}
		if photoURL.Valid {
			asset.PhotoURL = photoURL.String
		}
		if purchaseDate.Valid {
			asset.PurchaseDate = &purchaseDate.Time
		}
		if warrantyExpiry.Valid {
			asset.WarrantyExpiry = &warrantyExpiry.Time
		}
		if price.Valid {
			asset.Price = &price.Float64
		}
		if salvageValue.Valid {
			asset.SalvageValue = salvageValue.Float64
		}
		assets = append(assets, asset)
	}

	summary := DepreciationSummary{
		Assets: make([]DepreciationInfo, 0, len(assets)),
	}

	for _, asset := range assets {
		info := calculateDepreciation(&asset)
		summary.Assets = append(summary.Assets, *info)
		summary.TotalPurchaseValue += info.PurchasePrice
		summary.TotalCurrentValue += info.CurrentValue
		summary.TotalDepreciation += info.AccumulatedDepreciation

		switch info.Status {
		case "healthy":
			summary.HealthyCount++
		case "depreciated":
			summary.DepreciatedCount++
		case "fully_depreciated":
			summary.FullyDepreciatedCount++
		}
	}

	summary.TotalAssets = len(assets)
	return c.JSON(http.StatusOK, summary)
}

func calculateDepreciation(asset *models.Asset) *DepreciationInfo {
	info := &DepreciationInfo{
		AssetID:         asset.ID,
		AssetCode:       asset.Code,
		AssetName:       asset.Name,
		UsefulLifeYears: asset.UsefulLifeYears,
		SalvageValue:    asset.SalvageValue,
	}

	if asset.Price != nil {
		info.PurchasePrice = *asset.Price
	}

	if asset.PurchaseDate == nil || asset.UsefulLifeYears <= 0 || info.PurchasePrice <= 0 {
		info.CurrentValue = info.PurchasePrice
		info.Status = "healthy"
		return info
	}

	purchaseDate := asset.PurchaseDate
	now := time.Now()
	ageInDays := now.Sub(*purchaseDate).Hours() / 24
	info.AgeInYears = math.Round(ageInDays/365*100) / 100

	if info.UsefulLifeYears <= 0 {
		info.UsefulLifeYears = 5
	}
	if info.SalvageValue < 0 {
		info.SalvageValue = 0
	}

	depreciableAmount := info.PurchasePrice - info.SalvageValue
	if depreciableAmount <= 0 {
		info.CurrentValue = info.PurchasePrice
		info.Status = "healthy"
		return info
	}

	info.AnnualDepreciation = math.Round(depreciableAmount/float64(info.UsefulLifeYears)*100) / 100
	info.AccumulatedDepreciation = math.Round(info.AnnualDepreciation*info.AgeInYears*100) / 100

	if info.AccumulatedDepreciation > depreciableAmount {
		info.AccumulatedDepreciation = depreciableAmount
	}

	info.CurrentValue = math.Round((info.PurchasePrice-info.AccumulatedDepreciation)*100) / 100
	if info.CurrentValue < info.SalvageValue {
		info.CurrentValue = info.SalvageValue
	}

	info.RemainingLifeYears = math.Round((float64(info.UsefulLifeYears)-info.AgeInYears)*100) / 100
	if info.RemainingLifeYears < 0 {
		info.RemainingLifeYears = 0
	}

	info.AccumulatedDepreciation = math.Round(info.AccumulatedDepreciation*100) / 100

	if info.RemainingLifeYears <= 0 {
		info.Status = "fully_depreciated"
	} else if info.CurrentValue <= info.SalvageValue*1.1 {
		info.Status = "fully_depreciated"
	} else if info.AccumulatedDepreciation/depreciableAmount >= 0.5 {
		info.Status = "depreciated"
	} else {
		info.Status = "healthy"
	}

	return info
}
