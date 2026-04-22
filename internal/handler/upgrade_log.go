package handler

import (
	"net/http"
	"strconv"
	"time"

	"github.com/labstack/echo/v5"
	"lab-asset-manager/internal/models"
	"lab-asset-manager/internal/repository"
)

type UpgradeLogHandler struct{}

func NewUpgradeLogHandler() *UpgradeLogHandler {
	return &UpgradeLogHandler{}
}

func (h *UpgradeLogHandler) GetByAssetID(c *echo.Context) error {
	assetID := c.Param("assetId")

	rows, err := repository.DB.Query(`
		SELECT id, asset_id, upgrade_date, description 
		FROM upgrade_logs 
		WHERE asset_id = ? 
		ORDER BY upgrade_date DESC
	`, assetID)
	if err != nil {
		return c.JSON(http.StatusInternalServerError, map[string]string{"error": err.Error()})
	}
	defer rows.Close()

	var logs []models.UpgradeLog
	for rows.Next() {
		var log models.UpgradeLog
		if err := rows.Scan(&log.ID, &log.AssetID, &log.UpgradeDate, &log.Description); err != nil {
			continue
		}
		logs = append(logs, log)
	}

	if logs == nil {
		logs = []models.UpgradeLog{}
	}

	return c.JSON(http.StatusOK, logs)
}

func (h *UpgradeLogHandler) Create(c *echo.Context) error {
	assetID := c.Param("assetId")

	var log models.UpgradeLog
	if err := c.Bind(&log); err != nil {
		return c.JSON(http.StatusBadRequest, map[string]string{"error": err.Error()})
	}

	if log.UpgradeDate.IsZero() {
		log.UpgradeDate = time.Now()
	}

	result, err := repository.DB.Exec(`
		INSERT INTO upgrade_logs (asset_id, upgrade_date, description) 
		VALUES (?, ?, ?)
	`, assetID, log.UpgradeDate, log.Description)
	if err != nil {
		return c.JSON(http.StatusInternalServerError, map[string]string{"error": err.Error()})
	}

	id, _ := result.LastInsertId()
	log.ID = id
	log.AssetID, _ = strconv.ParseInt(assetID, 10, 64)

	return c.JSON(http.StatusCreated, log)
}

func (h *UpgradeLogHandler) Delete(c *echo.Context) error {
	id := c.Param("id")

	_, err := repository.DB.Exec("DELETE FROM upgrade_logs WHERE id = ?", id)
	if err != nil {
		return c.JSON(http.StatusInternalServerError, map[string]string{"error": err.Error()})
	}

	return c.JSON(http.StatusOK, map[string]string{"message": "deleted"})
}
