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
	MaintLabelWidth float64 `json:"maint_label_width"`
	MaintLabelHeight float64 `json:"maint_label_height"`
	MaintLabelCols int     `json:"maint_label_cols"`
	MaintLabelRows int     `json:"maint_label_rows"`
	MaintLabelMarginTop float64 `json:"maint_label_margin_top"`
	MaintLabelMarginLeft float64 `json:"maint_label_margin_left"`
	MaintLabelGapH float64 `json:"maint_label_gap_h"`
	MaintLabelGapV float64 `json:"maint_label_gap_v"`
	MaintLabelFontSize float64 `json:"maint_label_font_size"`
}

var settings = AppSettings{
	InstitutionName: "SMK NIBA",
	InstitutionLogo: "",
	Address:         "",
	Phone:           "",
	LabelRows:       4,
	LabelCols:       5,
	LabelWidth:      38.0,
	LabelHeight:     68.0,
	MaintLabelWidth:    64.0,
	MaintLabelHeight:   32.0,
	MaintLabelCols:     4,
	MaintLabelRows:     6,
	MaintLabelMarginTop:  5.0,
	MaintLabelMarginLeft: 2.0,
	MaintLabelGapH:      2.0,
	MaintLabelGapV:      2.0,
	MaintLabelFontSize:  8.0,
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
	if input.MaintLabelWidth > 0 {
		settings.MaintLabelWidth = input.MaintLabelWidth
	}
	if input.MaintLabelHeight > 0 {
		settings.MaintLabelHeight = input.MaintLabelHeight
	}
	if input.MaintLabelCols > 0 {
		settings.MaintLabelCols = input.MaintLabelCols
	}
	if input.MaintLabelRows > 0 {
		settings.MaintLabelRows = input.MaintLabelRows
	}
	if input.MaintLabelMarginTop >= 0 {
		settings.MaintLabelMarginTop = input.MaintLabelMarginTop
	}
	if input.MaintLabelMarginLeft >= 0 {
		settings.MaintLabelMarginLeft = input.MaintLabelMarginLeft
	}
	if input.MaintLabelGapH >= 0 {
		settings.MaintLabelGapH = input.MaintLabelGapH
	}
	if input.MaintLabelGapV >= 0 {
		settings.MaintLabelGapV = input.MaintLabelGapV
	}
	if input.MaintLabelFontSize > 0 {
		settings.MaintLabelFontSize = input.MaintLabelFontSize
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
