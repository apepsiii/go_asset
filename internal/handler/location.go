package handler

import (
	"fmt"
	"net/http"

	"github.com/labstack/echo/v5"
	"lab-asset-manager/internal/middleware"
	"lab-asset-manager/internal/service"
)

type LocationHandler struct {
	svc *service.LocationService
}

func NewLocationHandler() *LocationHandler {
	return &LocationHandler{svc: service.NewLocationService()}
}

func (h *LocationHandler) GetAll(c *echo.Context) error {
	items, err := h.svc.GetAll()
	if err != nil {
		return c.JSON(http.StatusInternalServerError, map[string]string{"error": err.Error()})
	}
	return c.JSON(http.StatusOK, items)
}

func (h *LocationHandler) GetByID(c *echo.Context) error {
	id := c.Param("id")
	item, err := h.svc.GetByID(id)
	if err != nil {
		return c.JSON(http.StatusNotFound, map[string]string{"error": err.Error()})
	}
	return c.JSON(http.StatusOK, item)
}

func (h *LocationHandler) Create(c *echo.Context) error {
	var input struct {
		Name string `json:"name"`
	}
	if err := c.Bind(&input); err != nil {
		return c.JSON(http.StatusBadRequest, map[string]string{"error": err.Error()})
	}

	item, err := h.svc.Create(input.Name)
	if err != nil {
		return c.JSON(http.StatusBadRequest, map[string]string{"error": err.Error()})
	}

	go service.RecordAudit(middleware.GetUserID(c), string(service.AuditCreate), "location", fmt.Sprint(item.ID), item, c.RealIP())

	return c.JSON(http.StatusCreated, item)
}

func (h *LocationHandler) Update(c *echo.Context) error {
	id := c.Param("id")
	var input struct {
		Name string `json:"name"`
	}
	if err := c.Bind(&input); err != nil {
		return c.JSON(http.StatusBadRequest, map[string]string{"error": err.Error()})
	}

	if err := h.svc.Update(id, input.Name); err != nil {
		return c.JSON(http.StatusBadRequest, map[string]string{"error": err.Error()})
	}

	go service.RecordAudit(middleware.GetUserID(c), string(service.AuditUpdate), "location", id, input, c.RealIP())

	return c.JSON(http.StatusOK, map[string]string{"message": "updated"})
}

func (h *LocationHandler) Delete(c *echo.Context) error {
	id := c.Param("id")

	if err := h.svc.Delete(id); err != nil {
		return c.JSON(http.StatusBadRequest, map[string]string{"error": err.Error()})
	}

	go service.RecordAudit(middleware.GetUserID(c), string(service.AuditDelete), "location", id, nil, c.RealIP())

	return c.JSON(http.StatusOK, map[string]string{"message": "deleted"})
}
