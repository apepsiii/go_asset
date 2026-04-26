package handler

import (
	"bytes"
	"fmt"
	"net/http"
	"os"

	"github.com/jung-kurt/gofpdf"
	"github.com/labstack/echo/v5"
	"github.com/skip2/go-qrcode"
	"lab-asset-manager/internal/repository"
)

type LabelHandler struct{}

func NewLabelHandler() *LabelHandler {
	return &LabelHandler{}
}

func (h *LabelHandler) GeneratePDF(c *echo.Context) error {
	assetID := c.Param("id")

	var code, name, condition, location, category string
	var price *float64

	err := repository.DB.QueryRow(`
		SELECT a.code, a.name, a.condition, l.name, c.name, a.price
		FROM assets a
		LEFT JOIN locations l ON a.location_id = l.id
		LEFT JOIN categories c ON a.category_id = c.id
		WHERE a.id = ?
	`, assetID).Scan(&code, &name, &condition, &location, &category, &price)

	if err != nil {
		return c.JSON(http.StatusNotFound, map[string]string{"error": "Asset not found"})
	}

	pdf := gofpdf.NewCustom(&gofpdf.InitType{
		OrientationStr: "L",
		UnitStr:        "mm",
		Size:           gofpdf.SizeType{Wd: 105, Ht: 74}, // A7 landscape: 105mm wide x 74mm tall
	})
	pdf.SetMargins(5, 5, 5)
	pdf.AddPage()

	pdf.SetFont("Arial", "B", 14)
	pdf.CellFormat(0, 8, "LAB ASSET MANAGER", "", 1, "C", false, 0, "")

	pdf.SetFont("Arial", "", 8)
	pdf.CellFormat(0, 5, "SMK Asset Management System", "", 1, "C", false, 0, "")
	pdf.Ln(3)

	pdf.SetFont("Arial", "B", 12)
	pdf.CellFormat(0, 7, name, "", 1, "C", false, 0, "")

	pdf.SetFont("Courier", "", 10)
	pdf.CellFormat(0, 6, "Code: "+code, "", 1, "C", false, 0, "")
	pdf.Ln(3)

	publicURL := os.Getenv("PUBLIC_URL")
	if publicURL == "" {
		publicURL = "http://localhost:5173"
	}
	qrURL := publicURL + "/public/asset/" + assetID
	qrPng, err := qrcode.Encode(qrURL, qrcode.Medium, 128)
	if err == nil {
		tmpDir := os.TempDir()
		qrFile := fmt.Sprintf("%s/qr-%s.png", tmpDir, code)
		os.WriteFile(qrFile, qrPng, 0644)
		pdf.Image(qrFile, 60, pdf.GetY(), 35, 35, false, "", 0, "")
		os.Remove(qrFile)
	}

	pdf.SetY(pdf.GetY() + 37)

	pdf.SetFont("Arial", "", 8)
	pdf.CellFormat(50, 5, "Category:", "0", 0, "L", false, 0, "")
	pdf.CellFormat(0, 5, category, "0", 1, "L", false, 0, "")

	pdf.CellFormat(50, 5, "Location:", "0", 0, "L", false, 0, "")
	pdf.CellFormat(0, 5, location, "0", 1, "L", false, 0, "")

	pdf.CellFormat(50, 5, "Condition:", "0", 0, "L", false, 0, "")
	pdf.CellFormat(0, 5, condition, "0", 1, "L", false, 0, "")

	if price != nil {
		pdf.CellFormat(50, 5, "Price:", "0", 0, "L", false, 0, "")
		pdf.CellFormat(0, 5, fmt.Sprintf("Rp %.0f", *price), "0", 1, "L", false, 0, "")
	}

	pdf.SetFont("Arial", "I", 6)
	pdf.CellFormat(0, 4, "Scan QR for details", "", 1, "C", false, 0, "")

	var buf bytes.Buffer
	if err := pdf.Output(&buf); err != nil {
		return c.JSON(http.StatusInternalServerError, map[string]string{"error": err.Error()})
	}

	c.Response().Header().Set("Content-Disposition", fmt.Sprintf("attachment; filename=asset-%s.pdf", code))
	c.Response().Header().Set("Content-Type", "application/pdf")

	return c.Blob(http.StatusOK, "application/pdf", buf.Bytes())
}
