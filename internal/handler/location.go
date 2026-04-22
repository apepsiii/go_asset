package handler

import (
	"database/sql"
	"net/http"
	"time"

	"github.com/labstack/echo/v5"
	"lab-asset-manager/internal/models"
	"lab-asset-manager/internal/repository"
)

type LocationHandler struct{}

func NewLocationHandler() *LocationHandler {
	return &LocationHandler{}
}

func (h *LocationHandler) GetAll(c *echo.Context) error {
	rows, err := repository.DB.Query("SELECT id, name, created_at FROM locations")
	if err != nil {
		return c.JSON(http.StatusInternalServerError, map[string]string{"error": err.Error()})
	}
	defer rows.Close()

	var items []models.Location
	for rows.Next() {
		var item models.Location
		if err := rows.Scan(&item.ID, &item.Name, &item.CreatedAt); err != nil {
			continue
		}
		items = append(items, item)
	}

	if items == nil {
		items = []models.Location{}
	}

	return c.JSON(http.StatusOK, items)
}

func (h *LocationHandler) GetByID(c *echo.Context) error {
	id := c.Param("id")
	var item models.Location
	err := repository.DB.QueryRow(
		"SELECT id, name, created_at FROM locations WHERE id = ?",
		id,
	).Scan(&item.ID, &item.Name, &item.CreatedAt)

	if err == sql.ErrNoRows {
		return c.JSON(http.StatusNotFound, map[string]string{"error": "not found"})
	}
	if err != nil {
		return c.JSON(http.StatusInternalServerError, map[string]string{"error": err.Error()})
	}

	return c.JSON(http.StatusOK, item)
}

func (h *LocationHandler) Create(c *echo.Context) error {
	var item models.Location
	if err := c.Bind(&item); err != nil {
		return c.JSON(http.StatusBadRequest, map[string]string{"error": err.Error()})
	}

	result, err := repository.DB.Exec(
		"INSERT INTO locations (name) VALUES (?)",
		item.Name,
	)
	if err != nil {
		return c.JSON(http.StatusInternalServerError, map[string]string{"error": err.Error()})
	}

	id, _ := result.LastInsertId()
	item.ID = id
	item.CreatedAt = time.Now()

	return c.JSON(http.StatusCreated, item)
}

func (h *LocationHandler) Update(c *echo.Context) error {
	id := c.Param("id")
	var item models.Location
	if err := c.Bind(&item); err != nil {
		return c.JSON(http.StatusBadRequest, map[string]string{"error": err.Error()})
	}

	_, err := repository.DB.Exec(
		"UPDATE locations SET name = ? WHERE id = ?",
		item.Name, id,
	)
	if err != nil {
		return c.JSON(http.StatusInternalServerError, map[string]string{"error": err.Error()})
	}

	return c.JSON(http.StatusOK, map[string]string{"message": "updated"})
}

func (h *LocationHandler) Delete(c *echo.Context) error {
	id := c.Param("id")

	_, err := repository.DB.Exec("DELETE FROM locations WHERE id = ?", id)
	if err != nil {
		return c.JSON(http.StatusInternalServerError, map[string]string{"error": err.Error()})
	}

	return c.JSON(http.StatusOK, map[string]string{"message": "deleted"})
}
