package handler

import (
	"fmt"
	"net/http"

	"github.com/labstack/echo/v5"
	"lab-asset-manager/internal/middleware"
	"lab-asset-manager/internal/service"
)

type BudgetSourceHandler struct {
	svc *service.BudgetSourceService
}

func NewBudgetSourceHandler() *BudgetSourceHandler {
	return &BudgetSourceHandler{svc: service.NewBudgetSourceService()}
}

func (h *BudgetSourceHandler) GetAll(c *echo.Context) error {
	items, err := h.svc.GetAll()
	if err != nil {
		return c.JSON(http.StatusInternalServerError, map[string]string{"error": err.Error()})
	}
	return c.JSON(http.StatusOK, items)
}

func (h *BudgetSourceHandler) GetByID(c *echo.Context) error {
	id := c.Param("id")
	item, err := h.svc.GetByID(id)
	if err != nil {
		return c.JSON(http.StatusNotFound, map[string]string{"error": err.Error()})
	}
	return c.JSON(http.StatusOK, item)
}

func (h *BudgetSourceHandler) Create(c *echo.Context) error {
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

	go service.RecordAudit(middleware.GetUserID(c), string(service.AuditCreate), "budget_source", fmt.Sprint(item.ID), item, c.RealIP())

	return c.JSON(http.StatusCreated, item)
}

func (h *BudgetSourceHandler) Update(c *echo.Context) error {
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

	go service.RecordAudit(middleware.GetUserID(c), string(service.AuditUpdate), "budget_source", id, input, c.RealIP())

	return c.JSON(http.StatusOK, map[string]string{"message": "updated"})
}

func (h *BudgetSourceHandler) Delete(c *echo.Context) error {
	id := c.Param("id")

	if err := h.svc.Delete(id); err != nil {
		return c.JSON(http.StatusBadRequest, map[string]string{"error": err.Error()})
	}

	go service.RecordAudit(middleware.GetUserID(c), string(service.AuditDelete), "budget_source", id, nil, c.RealIP())

	return c.JSON(http.StatusOK, map[string]string{"message": "deleted"})
}
