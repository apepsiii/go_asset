package handler

import (
	"database/sql"
	"net/http"
	"time"

	"github.com/labstack/echo/v5"
	"lab-asset-manager/internal/models"
	"lab-asset-manager/internal/repository"
)

type AssetHandler struct{}

func NewAssetHandler() *AssetHandler {
	return &AssetHandler{}
}

func (h *AssetHandler) GetAll(c *echo.Context) error {
	rows, err := repository.DB.Query(`
		SELECT id, category_id, budget_source_id, location_id, code, name, 
		       specification, photo_url, condition, purchase_date, price, 
		       warranty_expiry, created_at, updated_at 
		FROM assets
	`)
	if err != nil {
		return c.JSON(http.StatusInternalServerError, map[string]string{"error": err.Error()})
	}
	defer rows.Close()

	var assets []models.Asset
	for rows.Next() {
		var a models.Asset
		var purchaseDate, warrantyExpiry sql.NullTime
		var spec, photoURL sql.NullString

		if err := rows.Scan(
			&a.ID, &a.CategoryID, &a.BudgetSourceID, &a.LocationID,
			&a.Code, &a.Name, &spec, &photoURL, &a.Condition,
			&purchaseDate, &a.Price, &warrantyExpiry, &a.CreatedAt, &a.UpdatedAt,
		); err != nil {
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

		assets = append(assets, a)
	}

	if assets == nil {
		assets = []models.Asset{}
	}

	return c.JSON(http.StatusOK, assets)
}

func (h *AssetHandler) GetByID(c *echo.Context) error {
	id := c.Param("id")
	var a models.Asset
	var purchaseDate, warrantyExpiry sql.NullTime
	var spec, photoURL sql.NullString

	err := repository.DB.QueryRow(`
		SELECT id, category_id, budget_source_id, location_id, code, name, 
		       specification, photo_url, condition, purchase_date, price, 
		       warranty_expiry, created_at, updated_at 
		FROM assets WHERE id = ?
	`, id).Scan(
		&a.ID, &a.CategoryID, &a.BudgetSourceID, &a.LocationID,
		&a.Code, &a.Name, &spec, &photoURL, &a.Condition,
		&purchaseDate, &a.Price, &warrantyExpiry, &a.CreatedAt, &a.UpdatedAt,
	)

	if err == sql.ErrNoRows {
		return c.JSON(http.StatusNotFound, map[string]string{"error": "not found"})
	}
	if err != nil {
		return c.JSON(http.StatusInternalServerError, map[string]string{"error": err.Error()})
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

	return c.JSON(http.StatusOK, a)
}

func (h *AssetHandler) Create(c *echo.Context) error {
	var a models.Asset
	if err := c.Bind(&a); err != nil {
		return c.JSON(http.StatusBadRequest, map[string]string{"error": err.Error()})
	}

	now := time.Now()
	result, err := repository.DB.Exec(`
		INSERT INTO assets (category_id, budget_source_id, location_id, code, name, 
		                     specification, photo_url, condition, purchase_date, price, warranty_expiry)
		VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
	`,
		a.CategoryID, a.BudgetSourceID, a.LocationID, a.Code, a.Name,
		a.Specification, a.PhotoURL, a.Condition, a.PurchaseDate, a.Price, a.WarrantyExpiry,
	)
	if err != nil {
		return c.JSON(http.StatusInternalServerError, map[string]string{"error": err.Error()})
	}

	id, _ := result.LastInsertId()
	a.ID = id
	a.CreatedAt = now
	a.UpdatedAt = now

	return c.JSON(http.StatusCreated, a)
}

func (h *AssetHandler) Update(c *echo.Context) error {
	id := c.Param("id")
	var a models.Asset
	if err := c.Bind(&a); err != nil {
		return c.JSON(http.StatusBadRequest, map[string]string{"error": err.Error()})
	}

	_, err := repository.DB.Exec(`
		UPDATE assets SET category_id = ?, budget_source_id = ?, location_id = ?,
		                  code = ?, name = ?, specification = ?, photo_url = ?,
		                  condition = ?, purchase_date = ?, price = ?, warranty_expiry = ?
		WHERE id = ?
	`,
		a.CategoryID, a.BudgetSourceID, a.LocationID, a.Code, a.Name,
		a.Specification, a.PhotoURL, a.Condition, a.PurchaseDate, a.Price, a.WarrantyExpiry,
		id,
	)
	if err != nil {
		return c.JSON(http.StatusInternalServerError, map[string]string{"error": err.Error()})
	}

	return c.JSON(http.StatusOK, map[string]string{"message": "updated"})
}

func (h *AssetHandler) Delete(c *echo.Context) error {
	id := c.Param("id")

	_, err := repository.DB.Exec("DELETE FROM assets WHERE id = ?", id)
	if err != nil {
		return c.JSON(http.StatusInternalServerError, map[string]string{"error": err.Error()})
	}

	return c.JSON(http.StatusOK, map[string]string{"message": "deleted"})
}
