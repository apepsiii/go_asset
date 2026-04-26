package handler

import (
	"fmt"
	"net/http"

	"github.com/labstack/echo/v5"
	"lab-asset-manager/internal/middleware"
	"lab-asset-manager/internal/service"
)

type UpgradeLogHandler struct {
	svc *service.UpgradeLogService
}

func NewUpgradeLogHandler() *UpgradeLogHandler {
	return &UpgradeLogHandler{svc: service.NewUpgradeLogService()}
}

func (h *UpgradeLogHandler) GetByAssetID(c *echo.Context) error {
	assetID := c.Param("assetId")
	logs, err := h.svc.GetByAssetID(assetID)
	if err != nil {
		return c.JSON(http.StatusInternalServerError, map[string]string{"error": err.Error()})
	}
	return c.JSON(http.StatusOK, logs)
}

func (h *UpgradeLogHandler) Create(c *echo.Context) error {
	assetID := c.Param("assetId")
	var input service.CreateUpgradeLogInput
	if err := c.Bind(&input); err != nil {
		return c.JSON(http.StatusBadRequest, map[string]string{"error": err.Error()})
	}

	log, err := h.svc.Create(assetID, input)
	if err != nil {
		return c.JSON(http.StatusInternalServerError, map[string]string{"error": err.Error()})
	}

	go service.RecordAudit(middleware.GetUserID(c), string(service.AuditCreate), "upgrade_log", fmt.Sprint(log.ID), log, c.RealIP())

	return c.JSON(http.StatusCreated, log)
}

func (h *UpgradeLogHandler) Delete(c *echo.Context) error {
	id := c.Param("id")

	if err := h.svc.Delete(id); err != nil {
		return c.JSON(http.StatusBadRequest, map[string]string{"error": err.Error()})
	}

	go service.RecordAudit(middleware.GetUserID(c), string(service.AuditDelete), "upgrade_log", id, nil, c.RealIP())

	return c.JSON(http.StatusOK, map[string]string{"message": "deleted"})
}
