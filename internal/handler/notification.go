package handler

import (
	"net/http"
	"strconv"

	"github.com/labstack/echo/v5"
	"lab-asset-manager/internal/service"
)

type NotificationHandler struct{}

func NewNotificationHandler() *NotificationHandler {
	return &NotificationHandler{}
}

func (h *NotificationHandler) GetSummary(c *echo.Context) error {
	daysStr := c.QueryParamOr("warranty_days", "30")
	days, _ := strconv.Atoi(daysStr)

	summary, err := service.GetNotificationSummary(days)
	if err != nil {
		return c.JSON(http.StatusInternalServerError, map[string]string{"error": err.Error()})
	}

	return c.JSON(http.StatusOK, summary)
}

func (h *NotificationHandler) GetWarrantyAlerts(c *echo.Context) error {
	daysStr := c.QueryParamOr("days", "30")
	days, _ := strconv.Atoi(daysStr)

	alerts, err := service.GetWarrantyExpiringSoon(days)
	if err != nil {
		return c.JSON(http.StatusInternalServerError, map[string]string{"error": err.Error()})
	}

	return c.JSON(http.StatusOK, alerts)
}

func (h *NotificationHandler) GetBrokenAssets(c *echo.Context) error {
	alerts, err := service.GetBrokenAssetsNeedingAttention()
	if err != nil {
		return c.JSON(http.StatusInternalServerError, map[string]string{"error": err.Error()})
	}

	return c.JSON(http.StatusOK, alerts)
}
