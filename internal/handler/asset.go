package handler

import (
	"fmt"
	"net/http"

	"github.com/labstack/echo/v5"
	"lab-asset-manager/internal/middleware"
	"lab-asset-manager/internal/service"
)

type AssetHandler struct {
	svc *service.AssetService
}

func NewAssetHandler() *AssetHandler {
	return &AssetHandler{svc: service.NewAssetService()}
}

func (h *AssetHandler) GetAll(c *echo.Context) error {
	items, err := h.svc.GetAll()
	if err != nil {
		return c.JSON(http.StatusInternalServerError, map[string]string{"error": err.Error()})
	}
	return c.JSON(http.StatusOK, items)
}

func (h *AssetHandler) GetByID(c *echo.Context) error {
	id := c.Param("id")
	item, err := h.svc.GetByID(id)
	if err != nil {
		return c.JSON(http.StatusNotFound, map[string]string{"error": err.Error()})
	}
	return c.JSON(http.StatusOK, item)
}

func (h *AssetHandler) Create(c *echo.Context) error {
	var input service.CreateAssetInput
	if err := c.Bind(&input); err != nil {
		return c.JSON(http.StatusBadRequest, map[string]string{"error": err.Error()})
	}

	item, err := h.svc.Create(input)
	if err != nil {
		return c.JSON(http.StatusBadRequest, map[string]string{"error": err.Error()})
	}

	go service.RecordAudit(middleware.GetUserID(c), string(service.AuditCreate), "asset", fmt.Sprint(item.ID), input, c.RealIP())

	return c.JSON(http.StatusCreated, item)
}

func (h *AssetHandler) Update(c *echo.Context) error {
	id := c.Param("id")
	var input service.UpdateAssetInput
	if err := c.Bind(&input); err != nil {
		return c.JSON(http.StatusBadRequest, map[string]string{"error": err.Error()})
	}

	if err := h.svc.Update(id, input); err != nil {
		return c.JSON(http.StatusBadRequest, map[string]string{"error": err.Error()})
	}

	go service.RecordAudit(middleware.GetUserID(c), string(service.AuditUpdate), "asset", id, input, c.RealIP())

	return c.JSON(http.StatusOK, map[string]string{"message": "updated"})
}

func (h *AssetHandler) Delete(c *echo.Context) error {
	id := c.Param("id")

	if err := h.svc.Delete(id); err != nil {
		return c.JSON(http.StatusBadRequest, map[string]string{"error": err.Error()})
	}

	go service.RecordAudit(middleware.GetUserID(c), string(service.AuditDelete), "asset", id, nil, c.RealIP())

	return c.JSON(http.StatusOK, map[string]string{"message": "deleted"})
}
