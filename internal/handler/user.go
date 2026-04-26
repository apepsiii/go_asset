package handler

import (
	"net/http"

	"github.com/labstack/echo/v5"
	"lab-asset-manager/internal/middleware"
	"lab-asset-manager/internal/repository"
)

type UserHandler struct{}

func NewUserHandler() *UserHandler {
	return &UserHandler{}
}

type UserInfo struct {
	ID        string `json:"id"`
	Email     string `json:"email"`
	FirstName string `json:"first_name"`
	LastName  string `json:"last_name"`
	ImageURL  string `json:"image_url"`
	Role      string `json:"role"`
}

func (h *UserHandler) GetCurrentUser(c *echo.Context) error {
	userID := middleware.GetUserID(c)

	if userID == "anonymous" {
		return c.JSON(http.StatusOK, map[string]string{
			"id":    "anonymous",
			"role":  "user",
			"email": "",
		})
	}

	var user UserInfo
	err := repository.DB.QueryRow(`
		SELECT id, email, first_name, last_name, image_url, role
		FROM users WHERE id = ?
	`, userID).Scan(&user.ID, &user.Email, &user.FirstName, &user.LastName, &user.ImageURL, &user.Role)

	if err != nil {
		user.ID = userID
		user.Role = "user"
	}

	return c.JSON(http.StatusOK, user)
}

func (h *UserHandler) UpdateUserRole(c *echo.Context) error {
	userID := c.Param("id")
	var role string
	if err := c.Bind(&role); err != nil {
		return c.JSON(http.StatusBadRequest, map[string]string{"error": err.Error()})
	}

	if role != "admin" && role != "user" {
		return c.JSON(http.StatusBadRequest, map[string]string{"error": "role must be admin or user"})
	}

	_, err := repository.DB.Exec("UPDATE users SET role = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?", role, userID)
	if err != nil {
		return c.JSON(http.StatusInternalServerError, map[string]string{"error": err.Error()})
	}

	return c.JSON(http.StatusOK, map[string]string{"message": "role updated"})
}
