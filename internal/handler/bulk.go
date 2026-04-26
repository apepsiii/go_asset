package handler

import (
	"net/http"
	"strconv"
	"strings"

	"github.com/labstack/echo/v5"
	"lab-asset-manager/internal/middleware"
	"lab-asset-manager/internal/repository"
	"lab-asset-manager/internal/service"
)

type BulkHandler struct{}

func NewBulkHandler() *BulkHandler {
	return &BulkHandler{}
}

type BulkUpdateConditionInput struct {
	AssetIDs  []int64 `json:"asset_ids"`
	Condition string  `json:"condition"`
}

type BulkDeleteInput struct {
	AssetIDs []int64 `json:"asset_ids"`
}

func (h *BulkHandler) BulkUpdateCondition(c *echo.Context) error {
	var input BulkUpdateConditionInput
	if err := c.Bind(&input); err != nil {
		return c.JSON(http.StatusBadRequest, map[string]string{"error": err.Error()})
	}

	if len(input.AssetIDs) == 0 {
		return c.JSON(http.StatusBadRequest, map[string]string{"error": "no assets selected"})
	}

	validConditions := map[string]bool{"OK": true, "RUSAK_RINGAN": true, "RUSAK_TOTAL": true, "MAINTENANCE": true}
	if !validConditions[input.Condition] {
		return c.JSON(http.StatusBadRequest, map[string]string{"error": "invalid condition"})
	}

	updated := 0
	for _, id := range input.AssetIDs {
		result, err := repository.DB.Exec(
			"UPDATE assets SET condition = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?",
			input.Condition, id,
		)
		if err == nil {
			affected, _ := result.RowsAffected()
			updated += int(affected)
		}
	}

	go service.RecordAudit(
		middleware.GetUserID(c),
		string(service.AuditUpdate),
		"bulk_assets",
		"condition",
		map[string]interface{}{"condition": input.Condition, "updated": updated},
		c.RealIP(),
	)

	return c.JSON(http.StatusOK, map[string]interface{}{
		"message": "condition updated",
		"updated": updated,
	})
}

func (h *BulkHandler) BulkDelete(c *echo.Context) error {
	var input BulkDeleteInput
	if err := c.Bind(&input); err != nil {
		return c.JSON(http.StatusBadRequest, map[string]string{"error": err.Error()})
	}

	if len(input.AssetIDs) == 0 {
		return c.JSON(http.StatusBadRequest, map[string]string{"error": "no assets selected"})
	}

	placeholders := make([]string, len(input.AssetIDs))
	args := make([]interface{}, len(input.AssetIDs))
	for i, id := range input.AssetIDs {
		placeholders[i] = "?"
		args[i] = id
	}

	query := "DELETE FROM assets WHERE id IN (" + strings.Join(placeholders, ",") + ")"
	result, err := repository.DB.Exec(query, args...)
	if err != nil {
		return c.JSON(http.StatusInternalServerError, map[string]string{"error": err.Error()})
	}

	deleted, _ := result.RowsAffected()

	go service.RecordAudit(
		middleware.GetUserID(c),
		string(service.AuditDelete),
		"bulk_assets",
		"delete",
		map[string]int{"deleted": int(deleted)},
		c.RealIP(),
	)

	return c.JSON(http.StatusOK, map[string]interface{}{
		"message": "assets deleted",
		"deleted": deleted,
	})
}

func (h *BulkHandler) BulkUpdateLocation(c *echo.Context) error {
	var input struct {
		AssetIDs   []int64 `json:"asset_ids"`
		LocationID int64   `json:"location_id"`
	}
	if err := c.Bind(&input); err != nil {
		return c.JSON(http.StatusBadRequest, map[string]string{"error": err.Error()})
	}

	if len(input.AssetIDs) == 0 {
		return c.JSON(http.StatusBadRequest, map[string]string{"error": "no assets selected"})
	}

	updated := 0
	for _, id := range input.AssetIDs {
		result, err := repository.DB.Exec(
			"UPDATE assets SET location_id = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?",
			input.LocationID, id,
		)
		if err == nil {
			affected, _ := result.RowsAffected()
			updated += int(affected)
		}
	}

	go service.RecordAudit(
		middleware.GetUserID(c),
		string(service.AuditUpdate),
		"bulk_assets",
		"location",
		map[string]interface{}{"location_id": input.LocationID, "updated": updated},
		c.RealIP(),
	)

	return c.JSON(http.StatusOK, map[string]interface{}{
		"message": "location updated",
		"updated": updated,
	})
}

func (h *BulkHandler) BulkExport(c *echo.Context) error {
	idsParam := c.QueryParam("ids")
	if idsParam == "" {
		return c.JSON(http.StatusBadRequest, map[string]string{"error": "no assets selected"})
	}

	idStrs := strings.Split(idsParam, ",")
	var ids []int64
	for _, idStr := range idStrs {
		id, err := strconv.ParseInt(strings.TrimSpace(idStr), 10, 64)
		if err == nil {
			ids = append(ids, id)
		}
	}

	if len(ids) == 0 {
		return c.JSON(http.StatusBadRequest, map[string]string{"error": "no valid ids"})
	}

	placeholders := make([]string, len(ids))
	args := make([]interface{}, len(ids))
	for i, id := range ids {
		placeholders[i] = "?"
		args[i] = id
	}

	query := `SELECT a.id, a.code, a.name, c.name as category, l.name as location,
		a.condition, a.specification, a.price, a.purchase_date, a.warranty_expiry
		FROM assets a
		LEFT JOIN categories c ON a.category_id = c.id
		LEFT JOIN locations l ON a.location_id = l.id
		WHERE a.id IN (` + strings.Join(placeholders, ",") + ")"

	rows, err := repository.DB.Query(query, args...)
	if err != nil {
		return c.JSON(http.StatusInternalServerError, map[string]string{"error": err.Error()})
	}
	defer rows.Close()

	type AssetExport struct {
		ID             int64   `json:"id"`
		Code           string  `json:"code"`
		Name           string  `json:"name"`
		Category       string  `json:"category"`
		Location       string  `json:"location"`
		Condition      string  `json:"condition"`
		Specification  string  `json:"specification"`
		Price          float64 `json:"price"`
		PurchaseDate   string  `json:"purchase_date"`
		WarrantyExpiry string  `json:"warranty_expiry"`
	}

	var assets []AssetExport
	for rows.Next() {
		var a AssetExport
		var price *float64
		var purchaseDate, warrantyExpiry *string
		err := rows.Scan(&a.ID, &a.Code, &a.Name, &a.Category, &a.Location, &a.Condition, &a.Specification, &price, &purchaseDate, &warrantyExpiry)
		if err == nil {
			if price != nil {
				a.Price = *price
			}
			if purchaseDate != nil {
				a.PurchaseDate = *purchaseDate
			}
			if warrantyExpiry != nil {
				a.WarrantyExpiry = *warrantyExpiry
			}
			assets = append(assets, a)
		}
	}

	go service.RecordAudit(
		middleware.GetUserID(c),
		string(service.AuditRead),
		"bulk_assets",
		"export",
		map[string]int{"count": len(assets)},
		c.RealIP(),
	)

	return c.JSON(http.StatusOK, map[string]interface{}{
		"assets": assets,
		"total":  len(assets),
	})
}
