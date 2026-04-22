package handler

import (
	"net/http"
	"strconv"
	"time"

	"github.com/labstack/echo/v5"
	"lab-asset-manager/internal/models"
	"lab-asset-manager/internal/repository"
)

type MaintenanceLogHandler struct{}

func NewMaintenanceLogHandler() *MaintenanceLogHandler {
	return &MaintenanceLogHandler{}
}

func (h *MaintenanceLogHandler) GetByAssetID(c *echo.Context) error {
	assetID := c.Param("assetId")

	rows, err := repository.DB.Query(`
		SELECT id, asset_id, action_date, description, technician_name, cost 
		FROM maintenance_logs 
		WHERE asset_id = ? 
		ORDER BY action_date DESC
	`, assetID)
	if err != nil {
		return c.JSON(http.StatusInternalServerError, map[string]string{"error": err.Error()})
	}
	defer rows.Close()

	var logs []models.MaintenanceLog
	for rows.Next() {
		var log models.MaintenanceLog
		if err := rows.Scan(&log.ID, &log.AssetID, &log.ActionDate, &log.Description, &log.TechnicianName, &log.Cost); err != nil {
			continue
		}
		logs = append(logs, log)
	}

	if logs == nil {
		logs = []models.MaintenanceLog{}
	}

	return c.JSON(http.StatusOK, logs)
}

func (h *MaintenanceLogHandler) Create(c *echo.Context) error {
	assetID := c.Param("assetId")

	var log models.MaintenanceLog
	if err := c.Bind(&log); err != nil {
		return c.JSON(http.StatusBadRequest, map[string]string{"error": err.Error()})
	}

	if log.ActionDate.IsZero() {
		log.ActionDate = time.Now()
	}

	result, err := repository.DB.Exec(`
		INSERT INTO maintenance_logs (asset_id, action_date, description, technician_name, cost) 
		VALUES (?, ?, ?, ?, ?)
	`, assetID, log.ActionDate, log.Description, log.TechnicianName, log.Cost)
	if err != nil {
		return c.JSON(http.StatusInternalServerError, map[string]string{"error": err.Error()})
	}

	id, _ := result.LastInsertId()
	log.ID = id
	log.AssetID, _ = strconv.ParseInt(assetID, 10, 64)

	return c.JSON(http.StatusCreated, log)
}

func (h *MaintenanceLogHandler) Delete(c *echo.Context) error {
	id := c.Param("id")

	_, err := repository.DB.Exec("DELETE FROM maintenance_logs WHERE id = ?", id)
	if err != nil {
		return c.JSON(http.StatusInternalServerError, map[string]string{"error": err.Error()})
	}

	return c.JSON(http.StatusOK, map[string]string{"message": "deleted"})
}
