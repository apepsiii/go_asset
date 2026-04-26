package handler

import (
	"net/http"
	"strconv"

	"github.com/labstack/echo/v5"
	"lab-asset-manager/internal/middleware"
	"lab-asset-manager/internal/service"
)

type LoanHandler struct {
	svc *service.LoanService
}

func NewLoanHandler() *LoanHandler {
	return &LoanHandler{svc: service.NewLoanService()}
}

func (h *LoanHandler) Create(c *echo.Context) error {
	var input service.CreateLoanInput
	if err := c.Bind(&input); err != nil {
		return c.JSON(http.StatusBadRequest, map[string]string{"error": err.Error()})
	}

	input.LoanerID = middleware.GetUserID(c)

	loan, err := h.svc.Create(input)
	if err != nil {
		return c.JSON(http.StatusBadRequest, map[string]string{"error": err.Error()})
	}

	go service.RecordAudit(middleware.GetUserID(c), string(service.AuditCreate), "loan", strconv.FormatInt(loan.ID, 10), loan, c.RealIP())

	return c.JSON(http.StatusCreated, loan)
}

func (h *LoanHandler) GetByID(c *echo.Context) error {
	id := c.Param("id")
	loan, err := h.svc.GetByID(id)
	if err != nil {
		return c.JSON(http.StatusNotFound, map[string]string{"error": err.Error()})
	}
	return c.JSON(http.StatusOK, loan)
}

func (h *LoanHandler) GetAll(c *echo.Context) error {
	status := c.QueryParam("status")
	assetID := c.QueryParam("asset_id")
	limit, _ := strconv.Atoi(c.QueryParam("limit"))

	loans, err := h.svc.GetAll(status, assetID, limit)
	if err != nil {
		return c.JSON(http.StatusInternalServerError, map[string]string{"error": err.Error()})
	}
	return c.JSON(http.StatusOK, loans)
}

func (h *LoanHandler) Return(c *echo.Context) error {
	id := c.Param("id")

	var input service.ReturnLoanInput
	if err := c.Bind(&input); err != nil {
		return c.JSON(http.StatusBadRequest, map[string]string{"error": err.Error()})
	}

	loan, err := h.svc.Return(id, input)
	if err != nil {
		return c.JSON(http.StatusBadRequest, map[string]string{"error": err.Error()})
	}

	go service.RecordAudit(middleware.GetUserID(c), string(service.AuditUpdate), "loan_return", id, loan, c.RealIP())

	return c.JSON(http.StatusOK, loan)
}

func (h *LoanHandler) GetActiveLoans(c *echo.Context) error {
	loans, err := h.svc.GetActiveLoans()
	if err != nil {
		return c.JSON(http.StatusInternalServerError, map[string]string{"error": err.Error()})
	}
	return c.JSON(http.StatusOK, loans)
}

func (h *LoanHandler) GetOverdueLoans(c *echo.Context) error {
	loans, err := h.svc.GetOverdueLoans()
	if err != nil {
		return c.JSON(http.StatusInternalServerError, map[string]string{"error": err.Error()})
	}
	return c.JSON(http.StatusOK, loans)
}

func (h *LoanHandler) GetAvailableAssets(c *echo.Context) error {
	assets, err := h.svc.GetAvailableAssets()
	if err != nil {
		return c.JSON(http.StatusInternalServerError, map[string]string{"error": err.Error()})
	}
	return c.JSON(http.StatusOK, assets)
}

func (h *LoanHandler) GetStats(c *echo.Context) error {
	stats, err := h.svc.GetStats()
	if err != nil {
		return c.JSON(http.StatusInternalServerError, map[string]string{"error": err.Error()})
	}
	return c.JSON(http.StatusOK, stats)
}
