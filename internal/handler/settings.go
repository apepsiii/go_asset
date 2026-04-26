package handler

import (
	"fmt"
	"net/http"
	"os"
	"path/filepath"

	"github.com/labstack/echo/v5"
)

type SettingsHandler struct{}

func NewSettingsHandler() *SettingsHandler {
	return &SettingsHandler{}
}

type AppSettings struct {
	InstitutionName string  `json:"institution_name"`
	InstitutionLogo string  `json:"institution_logo"`
	Address         string  `json:"address"`
	Phone           string  `json:"phone"`
	LabelRows       int     `json:"label_rows"`
	LabelCols       int     `json:"label_cols"`
	LabelWidth      float64 `json:"label_width"`
	LabelHeight     float64 `json:"label_height"`
}

var settings = AppSettings{
	InstitutionName: "SMK NIBA",
	InstitutionLogo: "",
	Address:         "",
	Phone:           "",
	LabelRows:       7,
	LabelCols:       3,
	LabelWidth:      63.5,
	LabelHeight:     25.4,
}

func (h *SettingsHandler) GetSettings(c *echo.Context) error {
	return c.JSON(http.StatusOK, settings)
}

func (h *SettingsHandler) UpdateSettings(c *echo.Context) error {
	var input AppSettings
	if err := c.Bind(&input); err != nil {
		return c.JSON(http.StatusBadRequest, map[string]string{"error": err.Error()})
	}

	if input.InstitutionName != "" {
		settings.InstitutionName = input.InstitutionName
	}
	if input.Address != "" {
		settings.Address = input.Address
	}
	if input.Phone != "" {
		settings.Phone = input.Phone
	}
	if input.LabelRows > 0 && input.LabelRows <= 20 {
		settings.LabelRows = input.LabelRows
	}
	if input.LabelCols > 0 && input.LabelCols <= 10 {
		settings.LabelCols = input.LabelCols
	}
	if input.LabelWidth > 0 {
		settings.LabelWidth = input.LabelWidth
	}
	if input.LabelHeight > 0 {
		settings.LabelHeight = input.LabelHeight
	}

	return c.JSON(http.StatusOK, settings)
}

func (h *SettingsHandler) UploadLogo(c *echo.Context) error {
	file, err := c.FormFile("logo")
	if err != nil {
		return c.JSON(http.StatusBadRequest, map[string]string{"error": "No file uploaded"})
	}

	src, err := file.Open()
	if err != nil {
		return c.JSON(http.StatusInternalServerError, map[string]string{"error": err.Error()})
	}
	defer src.Close()

	ext := filepath.Ext(file.Filename)
	if ext != ".png" && ext != ".jpg" && ext != ".jpeg" && ext != ".svg" {
		return c.JSON(http.StatusBadRequest, map[string]string{"error": "Only PNG, JPG, SVG allowed"})
	}

	filename := fmt.Sprintf("logo_%d%s", 1, ext)
	dst, err := os.Create(filepath.Join("./uploads", filename))
	if err != nil {
		return c.JSON(http.StatusInternalServerError, map[string]string{"error": err.Error()})
	}
	defer dst.Close()

	buffer := make([]byte, 1024)
	for {
		n, err := src.Read(buffer)
		if n > 0 {
			dst.Write(buffer[:n])
		}
		if err != nil {
			break
		}
	}

	settings.InstitutionLogo = "/uploads/" + filename

	return c.JSON(http.StatusOK, map[string]string{
		"url": settings.InstitutionLogo,
	})
}

func (h *SettingsHandler) GetPublicSettings(c *echo.Context) error {
	return c.JSON(http.StatusOK, map[string]interface{}{
		"institution_name": settings.InstitutionName,
		"institution_logo": settings.InstitutionLogo,
		"address":          settings.Address,
		"phone":            settings.Phone,
	})
}
