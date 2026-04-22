package handler

import (
	"database/sql"
	"net/http"
	"time"

	"github.com/labstack/echo/v5"
	"lab-asset-manager/internal/models"
	"lab-asset-manager/internal/repository"
)

type CategoryHandler struct{}

func NewCategoryHandler() *CategoryHandler {
	return &CategoryHandler{}
}

func (h *CategoryHandler) GetAll(c *echo.Context) error {
	rows, err := repository.DB.Query("SELECT id, name, created_at FROM categories")
	if err != nil {
		return c.JSON(http.StatusInternalServerError, map[string]string{"error": err.Error()})
	}
	defer rows.Close()

	var categories []models.Category
	for rows.Next() {
		var cat models.Category
		if err := rows.Scan(&cat.ID, &cat.Name, &cat.CreatedAt); err != nil {
			continue
		}
		categories = append(categories, cat)
	}

	if categories == nil {
		categories = []models.Category{}
	}

	return c.JSON(http.StatusOK, categories)
}

func (h *CategoryHandler) Create(c *echo.Context) error {
	var cat models.Category
	if err := c.Bind(&cat); err != nil {
		return c.JSON(http.StatusBadRequest, map[string]string{"error": err.Error()})
	}

	result, err := repository.DB.Exec(
		"INSERT INTO categories (name) VALUES (?)",
		cat.Name,
	)
	if err != nil {
		return c.JSON(http.StatusInternalServerError, map[string]string{"error": err.Error()})
	}

	id, _ := result.LastInsertId()
	cat.ID = id
	cat.CreatedAt = time.Now()

	return c.JSON(http.StatusCreated, cat)
}

func (h *CategoryHandler) Update(c *echo.Context) error {
	id := c.Param("id")
	var cat models.Category
	if err := c.Bind(&cat); err != nil {
		return c.JSON(http.StatusBadRequest, map[string]string{"error": err.Error()})
	}

	_, err := repository.DB.Exec(
		"UPDATE categories SET name = ? WHERE id = ?",
		cat.Name, id,
	)
	if err != nil {
		return c.JSON(http.StatusInternalServerError, map[string]string{"error": err.Error()})
	}

	return c.JSON(http.StatusOK, map[string]string{"message": "updated"})
}

func (h *CategoryHandler) Delete(c *echo.Context) error {
	id := c.Param("id")

	_, err := repository.DB.Exec("DELETE FROM categories WHERE id = ?", id)
	if err != nil {
		return c.JSON(http.StatusInternalServerError, map[string]string{"error": err.Error()})
	}

	return c.JSON(http.StatusOK, map[string]string{"message": "deleted"})
}

func (h *CategoryHandler) GetByID(c *echo.Context) error {
	id := c.Param("id")
	var cat models.Category
	err := repository.DB.QueryRow(
		"SELECT id, name, created_at FROM categories WHERE id = ?",
		id,
	).Scan(&cat.ID, &cat.Name, &cat.CreatedAt)

	if err == sql.ErrNoRows {
		return c.JSON(http.StatusNotFound, map[string]string{"error": "not found"})
	}
	if err != nil {
		return c.JSON(http.StatusInternalServerError, map[string]string{"error": err.Error()})
	}

	return c.JSON(http.StatusOK, cat)
}
