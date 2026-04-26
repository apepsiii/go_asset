package handler

import (
	"database/sql"
	"fmt"
	"net/http"
	"time"

	"github.com/labstack/echo/v5"
	"lab-asset-manager/internal/repository"
)

type CodeHandler struct{}

func NewCodeHandler() *CodeHandler {
	return &CodeHandler{}
}

type GenerateCodeResponse struct {
	Code string `json:"code"`
}

func (h *CodeHandler) GenerateCode(c *echo.Context) error {
	categoryID := c.QueryParam("category_id")
	if categoryID == "" {
		return c.JSON(http.StatusBadRequest, map[string]string{"error": "category_id is required"})
	}

	var categoryName string
	err := repository.DB.QueryRow("SELECT name FROM categories WHERE id = ?", categoryID).Scan(&categoryName)
	if err != nil {
		return c.JSON(http.StatusNotFound, map[string]string{"error": "category not found"})
	}

	prefix := getPrefix(categoryName)
	dateStr := time.Now().Format("020106")

	var maxSeq int
	likePattern := prefix + "%"
	err = repository.DB.QueryRow(`
		SELECT COALESCE(MAX(CAST(SUBSTR(code, 9) AS INTEGER)), 0)
		FROM assets
		WHERE code LIKE ? AND SUBSTR(code, 4, 6) = ?
	`, likePattern, dateStr).Scan(&maxSeq)

	if err != nil && err != sql.ErrNoRows {
		maxSeq = 0
	}

	nextSeq := maxSeq + 1
	code := fmt.Sprintf("%s%s%05d", prefix, dateStr, nextSeq)

	return c.JSON(http.StatusOK, GenerateCodeResponse{Code: code})
}

func getPrefix(categoryName string) string {
	result := ""
	for _, r := range categoryName {
		if (r >= 'A' && r <= 'Z') || (r >= 'a' && r <= 'z') {
			result += string(r &^ ' ')
		}
		if len(result) == 3 {
			break
		}
	}
	for len(result) < 3 {
		result += "X"
	}
	return result
}
