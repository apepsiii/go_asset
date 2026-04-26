package handler

import (
	"net/http"
	"os"
	"strings"
	"time"

	"github.com/labstack/echo/v5"
	"lab-asset-manager/internal/service"
)

type QuickLoanHandler struct{}

func NewQuickLoanHandler() *QuickLoanHandler {
	return &QuickLoanHandler{}
}

type QuickLoanInput struct {
	AssetID      int64  `json:"asset_id"`
	BorrowerName string `json:"borrower_name"`
	AdminPin     string `json:"admin_pin"`
	DurationDays int    `json:"duration_days"`
}

type RateLimiter struct {
	attempts map[string][]time.Time
	limit    int
	window   time.Duration
}

var rateLimiter = &RateLimiter{
	attempts: make(map[string][]time.Time),
	limit:    10,
	window:   time.Minute * 5,
}

func (rl *RateLimiter) isAllowed(ip string) bool {
	now := time.Now()
	cutoff := now.Add(-rl.window)

	if _, exists := rl.attempts[ip]; !exists {
		rl.attempts[ip] = []time.Time{}
	}

	var validAttempts []time.Time
	for _, t := range rl.attempts[ip] {
		if t.After(cutoff) {
			validAttempts = append(validAttempts, t)
		}
	}
	rl.attempts[ip] = validAttempts

	if len(validAttempts) >= rl.limit {
		return false
	}

	rl.attempts[ip] = append(rl.attempts[ip], now)
	return true
}

func (h *QuickLoanHandler) CreateQuickLoan(c *echo.Context) error {
	clientIP := c.RealIP()

	if !rateLimiter.isAllowed(clientIP) {
		return c.JSON(http.StatusTooManyRequests, map[string]string{
			"error": "Terlalu banyak percobaan. Silakan coba lagi dalam 5 menit.",
		})
	}

	var input QuickLoanInput
	if err := c.Bind(&input); err != nil {
		return c.JSON(http.StatusBadRequest, map[string]string{"error": err.Error()})
	}

	if input.AssetID <= 0 {
		return c.JSON(http.StatusBadRequest, map[string]string{"error": "asset_id diperlukan"})
	}
	if input.BorrowerName == "" {
		return c.JSON(http.StatusBadRequest, map[string]string{"error": "borrower_name diperlukan"})
	}
	if input.AdminPin == "" {
		return c.JSON(http.StatusBadRequest, map[string]string{"error": "admin_pin diperlukan"})
	}

	validPin := os.Getenv("QUICK_LOAN_PIN")
	if validPin == "" {
		validPin = "123456"
	}

	hashedInput := hashPin(input.AdminPin)
	hashedValid := hashPin(validPin)

	if hashedInput != hashedValid {
		return c.JSON(http.StatusUnauthorized, map[string]string{"error": "PIN tidak valid"})
	}

	durationDays := input.DurationDays
	if durationDays <= 0 {
		durationDays = 7
	}

	now := time.Now()
	dueDate := now.AddDate(0, 0, durationDays)

	loanService := service.NewLoanService()
	loan, err := loanService.Create(service.CreateLoanInput{
		AssetID:      input.AssetID,
		BorrowerName: input.BorrowerName,
		LoanDate:     now.Format("2006-01-02T15:04:05Z07:00"),
		DueDate:      dueDate.Format("2006-01-02T15:04:05Z07:00"),
		LoanerID:     "quick-loan",
	})

	if err != nil {
		return c.JSON(http.StatusBadRequest, map[string]string{"error": err.Error()})
	}

	go service.RecordAudit(
		"quick-loan",
		string(service.AuditCreate),
		"loan",
		"quick",
		map[string]interface{}{
			"asset_id":      input.AssetID,
			"borrower_name": input.BorrowerName,
			"due_date":      dueDate.Format("2006-01-02"),
		},
		clientIP,
	)

	return c.JSON(http.StatusCreated, loan)
}

func hashPin(pin string) string {
	var hash int
	for i, c := range pin {
		hash = hash*31 + int(c) + i
	}
	return strings.ToUpper(hexEncode(hash))
}

func hexEncode(n int) string {
	const chars = "0123456789ABCDEF"
	if n == 0 {
		return "0"
	}
	var result []byte
	for n > 0 {
		result = append([]byte{chars[n%16]}, result...)
		n /= 16
	}
	return string(result)
}
