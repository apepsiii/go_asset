package handler

import (
	"net/http"

	"github.com/labstack/echo/v5"
	"lab-asset-manager/internal/service"
)

type AuditLogHandler struct{}

func NewAuditLogHandler() *AuditLogHandler {
	return &AuditLogHandler{}
}

func (h *AuditLogHandler) GetAll(c *echo.Context) error {
	resource := c.QueryParam("resource")

	logs, err := service.GetAuditLogs(resource, 100)
	if err != nil {
		return c.JSON(http.StatusInternalServerError, map[string]string{"error": err.Error()})
	}

	return c.JSON(http.StatusOK, logs)
}
