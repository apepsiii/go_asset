package handler

import (
	"bytes"
	"fmt"
	"net/http"
	"time"

	"github.com/jung-kurt/gofpdf"
	"github.com/labstack/echo/v5"
	"lab-asset-manager/internal/repository"
)

type ReportHandler struct{}

func NewReportHandler() *ReportHandler {
	return &ReportHandler{}
}

type ReportParams struct {
	Type       string `query:"type"`
	LocationID int    `query:"location_id"`
	CategoryID int    `query:"category_id"`
	Condition  string `query:"condition"`
}

func (h *ReportHandler) GenerateReport(c *echo.Context) error {
	var params ReportParams
	if err := c.Bind(&params); err != nil {
		return c.JSON(http.StatusBadRequest, map[string]string{"error": err.Error()})
	}

	if params.Type == "" {
		params.Type = "summary"
	}

	switch params.Type {
	case "full":
		return h.generateFullReport(c)
	case "by_location":
		return h.generateByLocationReport(c, params.LocationID)
	case "by_category":
		return h.generateByCategoryReport(c, params.CategoryID)
	case "by_condition":
		return h.generateByConditionReport(c, params.Condition)
	case "maintenance":
		return h.generateMaintenanceReport(c)
	default:
		return h.generateSummaryReport(c)
	}
}

func (h *ReportHandler) generateSummaryReport(c *echo.Context) error {
	pdf := gofpdf.New("P", "mm", "A4", "")
	pdf.SetAutoPageBreak(true, 15)
	pdf.AddPage()

	h.addReportHeader(pdf, "Laporan Ringkasan Aset")

	var totalAssets, okCount, rusakRingan, rusakTotal, maintenance int
	var totalValue float64

	repository.DB.QueryRow("SELECT COUNT(*) FROM assets").Scan(&totalAssets)
	repository.DB.QueryRow("SELECT COUNT(*) FROM assets WHERE condition = 'OK'").Scan(&okCount)
	repository.DB.QueryRow("SELECT COUNT(*) FROM assets WHERE condition = 'RUSAK_RINGAN'").Scan(&rusakRingan)
	repository.DB.QueryRow("SELECT COUNT(*) FROM assets WHERE condition = 'RUSAK_TOTAL'").Scan(&rusakTotal)
	repository.DB.QueryRow("SELECT COUNT(*) FROM assets WHERE condition = 'MAINTENANCE'").Scan(&maintenance)
	repository.DB.QueryRow("SELECT COALESCE(SUM(price), 0) FROM assets").Scan(&totalValue)

	pdf.SetFont("A", "", 11)
	pdf.Ln(5)

	pdf.CellFormat(60, 8, "Total Aset", "0", 0, "L", false, 0, "")
	pdf.CellFormat(0, 8, fmt.Sprintf("%d unit", totalAssets), "0", 1, "L", false, 0, "")

	pdf.CellFormat(60, 8, "Total Nilai Aset", "0", 0, "L", false, 0, "")
	pdf.CellFormat(0, 8, fmt.Sprintf("Rp %s", formatNumber(totalValue)), "0", 1, "L", false, 0, "")

	pdf.Ln(5)
	pdf.SetFont("A", "B", 12)
	pdf.CellFormat(0, 8, "Kondisi Aset", "", 1, "L", false, 0, "")

	pdf.SetFont("A", "", 11)
	h.addConditionRow(pdf, "Baik (OK)", okCount, "#22c55e")
	h.addConditionRow(pdf, "Rusak Ringan", rusakRingan, "#eab308")
	h.addConditionRow(pdf, "Rusak Total", rusakTotal, "#ef4444")
	h.addConditionRow(pdf, "Maintenance", maintenance, "#3b82f6")

	pdf.Ln(5)
	pdf.SetFont("A", "B", 12)
	pdf.CellFormat(0, 8, "Aset per Lokasi", "", 1, "L", false, 0, "")

	rows, err := repository.DB.Query(`
		SELECT l.name, COUNT(a.id)
		FROM locations l
		LEFT JOIN assets a ON l.id = a.location_id
		GROUP BY l.id, l.name
		ORDER BY COUNT(a.id) DESC
	`)
	if err == nil {
		defer rows.Close()
		pdf.SetFont("A", "", 11)
		for rows.Next() {
			var name string
			var count int
			rows.Scan(&name, &count)
			pdf.CellFormat(60, 7, name, "0", 0, "L", false, 0, "")
			pdf.CellFormat(0, 7, fmt.Sprintf("%d unit", count), "0", 1, "L", false, 0, "")
		}
	}

	pdf.Ln(5)
	pdf.SetFont("A", "B", 12)
	pdf.CellFormat(0, 8, "Aset per Kategori", "", 1, "L", false, 0, "")

	rows, err = repository.DB.Query(`
		SELECT c.name, COUNT(a.id)
		FROM categories c
		LEFT JOIN assets a ON c.id = a.category_id
		GROUP BY c.id, c.name
		ORDER BY COUNT(a.id) DESC
	`)
	if err == nil {
		defer rows.Close()
		pdf.SetFont("A", "", 11)
		for rows.Next() {
			var name string
			var count int
			rows.Scan(&name, &count)
			pdf.CellFormat(60, 7, name, "0", 0, "L", false, 0, "")
			pdf.CellFormat(0, 7, fmt.Sprintf("%d unit", count), "0", 1, "L", false, 0, "")
		}
	}

	return h.outputPDF(c, pdf, "laporan-ringkasan")
}

func (h *ReportHandler) generateFullReport(c *echo.Context) error {
	pdf := gofpdf.New("L", "mm", "A4", "")
	pdf.SetAutoPageBreak(true, 15)
	pdf.AddPage()

	h.addReportHeader(pdf, "Laporan Lengkap Aset")

	rows, err := repository.DB.Query(`
		SELECT a.code, a.name, c.name, l.name, a.condition, a.price
		FROM assets a
		LEFT JOIN categories c ON a.category_id = c.id
		LEFT JOIN locations l ON a.location_id = l.id
		ORDER BY a.code
	`)
	if err != nil {
		return c.JSON(http.StatusInternalServerError, map[string]string{"error": err.Error()})
	}
	defer rows.Close()

	h.addTableHeader(pdf, []string{"Kode", "Nama", "Kategori", "Lokasi", "Kondisi", "Harga"})

	pdf.SetFont("A", "", 9)
	for rows.Next() {
		var code, name, category, location, condition string
		var price *float64
		rows.Scan(&code, &name, &category, &location, &condition, &price)

		pdf.CellFormat(30, 7, h.truncate(code, 28), "1", 0, "L", false, 0, "")
		pdf.CellFormat(60, 7, h.truncate(name, 55), "1", 0, "L", false, 0, "")
		pdf.CellFormat(40, 7, h.truncate(category, 38), "1", 0, "L", false, 0, "")
		pdf.CellFormat(40, 7, h.truncate(location, 38), "1", 0, "L", false, 0, "")
		pdf.CellFormat(30, 7, condition, "1", 0, "L", false, 0, "")
		if price != nil {
			pdf.CellFormat(0, 7, fmt.Sprintf("Rp %s", formatNumber(*price)), "1", 1, "R", false, 0, "")
		} else {
			pdf.CellFormat(0, 7, "-", "1", 1, "L", false, 0, "")
		}
	}

	return h.outputPDF(c, pdf, "laporan-lengkap")
}

func (h *ReportHandler) generateByLocationReport(c *echo.Context, locationID int) error {
	pdf := gofpdf.New("L", "mm", "A4", "")
	pdf.SetAutoPageBreak(true, 15)

	var locationName string
	if locationID > 0 {
		repository.DB.QueryRow("SELECT name FROM locations WHERE id = ?", locationID).Scan(&locationName)
	}

	if locationName == "" {
		locationName = "Semua Lokasi"
	}

	pdf.AddPage()
	h.addReportHeader(pdf, fmt.Sprintf("Laporan Aset per Lokasi: %s", locationName))

	query := `
		SELECT a.code, a.name, c.name, a.condition, a.price
		FROM assets a
		LEFT JOIN categories c ON a.category_id = c.id
		WHERE a.location_id = ? OR ? = 0
		ORDER BY a.code
	`
	rows, err := repository.DB.Query(query, locationID, locationID)
	if err != nil {
		return c.JSON(http.StatusInternalServerError, map[string]string{"error": err.Error()})
	}
	defer rows.Close()

	h.addTableHeader(pdf, []string{"Kode", "Nama", "Kategori", "Kondisi", "Harga"})

	pdf.SetFont("A", "", 9)
	var totalValue float64
	for rows.Next() {
		var code, name, category, condition string
		var price *float64
		rows.Scan(&code, &name, &category, &condition, &price)

		pdf.CellFormat(35, 7, h.truncate(code, 32), "1", 0, "L", false, 0, "")
		pdf.CellFormat(80, 7, h.truncate(name, 75), "1", 0, "L", false, 0, "")
		pdf.CellFormat(50, 7, h.truncate(category, 47), "1", 0, "L", false, 0, "")
		pdf.CellFormat(40, 7, condition, "1", 0, "L", false, 0, "")
		if price != nil {
			totalValue += *price
			pdf.CellFormat(0, 7, fmt.Sprintf("Rp %s", formatNumber(*price)), "1", 1, "R", false, 0, "")
		} else {
			pdf.CellFormat(0, 7, "-", "1", 1, "L", false, 0, "")
		}
	}

	pdf.SetFont("A", "B", 10)
	pdf.Ln(5)
	pdf.CellFormat(0, 7, fmt.Sprintf("Total Nilai: Rp %s", formatNumber(totalValue)), "", 1, "R", false, 0, "")

	return h.outputPDF(c, pdf, fmt.Sprintf("laporan-lokasi-%d", locationID))
}

func (h *ReportHandler) generateByCategoryReport(c *echo.Context, categoryID int) error {
	pdf := gofpdf.New("L", "mm", "A4", "")
	pdf.SetAutoPageBreak(true, 15)

	var categoryName string
	if categoryID > 0 {
		repository.DB.QueryRow("SELECT name FROM categories WHERE id = ?", categoryID).Scan(&categoryName)
	}

	if categoryName == "" {
		categoryName = "Semua Kategori"
	}

	pdf.AddPage()
	h.addReportHeader(pdf, fmt.Sprintf("Laporan Aset per Kategori: %s", categoryName))

	query := `
		SELECT a.code, a.name, l.name, a.condition, a.price
		FROM assets a
		LEFT JOIN locations l ON a.location_id = l.id
		WHERE a.category_id = ? OR ? = 0
		ORDER BY a.code
	`
	rows, err := repository.DB.Query(query, categoryID, categoryID)
	if err != nil {
		return c.JSON(http.StatusInternalServerError, map[string]string{"error": err.Error()})
	}
	defer rows.Close()

	h.addTableHeader(pdf, []string{"Kode", "Nama", "Lokasi", "Kondisi", "Harga"})

	pdf.SetFont("A", "", 9)
	var totalValue float64
	for rows.Next() {
		var code, name, location, condition string
		var price *float64
		rows.Scan(&code, &name, &location, &condition, &price)

		pdf.CellFormat(35, 7, h.truncate(code, 32), "1", 0, "L", false, 0, "")
		pdf.CellFormat(80, 7, h.truncate(name, 75), "1", 0, "L", false, 0, "")
		pdf.CellFormat(60, 7, h.truncate(location, 57), "1", 0, "L", false, 0, "")
		pdf.CellFormat(40, 7, condition, "1", 0, "L", false, 0, "")
		if price != nil {
			totalValue += *price
			pdf.CellFormat(0, 7, fmt.Sprintf("Rp %s", formatNumber(*price)), "1", 1, "R", false, 0, "")
		} else {
			pdf.CellFormat(0, 7, "-", "1", 1, "L", false, 0, "")
		}
	}

	pdf.SetFont("A", "B", 10)
	pdf.Ln(5)
	pdf.CellFormat(0, 7, fmt.Sprintf("Total Nilai: Rp %s", formatNumber(totalValue)), "", 1, "R", false, 0, "")

	return h.outputPDF(c, pdf, fmt.Sprintf("laporan-kategori-%d", categoryID))
}

func (h *ReportHandler) generateByConditionReport(c *echo.Context, condition string) error {
	pdf := gofpdf.New("L", "mm", "A4", "")
	pdf.SetAutoPageBreak(true, 15)

	conditionName := condition
	if conditionName == "" {
		conditionName = "Semua Kondisi"
	}

	pdf.AddPage()
	h.addReportHeader(pdf, fmt.Sprintf("Laporan Aset per Kondisi: %s", conditionName))

	query := `
		SELECT a.code, a.name, c.name, l.name, a.price
		FROM assets a
		LEFT JOIN categories c ON a.category_id = c.id
		LEFT JOIN locations l ON a.location_id = l.id
		WHERE a.condition = ? OR ? = ''
		ORDER BY a.code
	`
	rows, err := repository.DB.Query(query, condition, condition)
	if err != nil {
		return c.JSON(http.StatusInternalServerError, map[string]string{"error": err.Error()})
	}
	defer rows.Close()

	h.addTableHeader(pdf, []string{"Kode", "Nama", "Kategori", "Lokasi", "Harga"})

	pdf.SetFont("A", "", 9)
	var totalValue float64
	for rows.Next() {
		var code, name, category, location string
		var price *float64
		rows.Scan(&code, &name, &category, &location, &price)

		pdf.CellFormat(35, 7, h.truncate(code, 32), "1", 0, "L", false, 0, "")
		pdf.CellFormat(70, 7, h.truncate(name, 65), "1", 0, "L", false, 0, "")
		pdf.CellFormat(50, 7, h.truncate(category, 47), "1", 0, "L", false, 0, "")
		pdf.CellFormat(60, 7, h.truncate(location, 57), "1", 0, "L", false, 0, "")
		if price != nil {
			totalValue += *price
			pdf.CellFormat(0, 7, fmt.Sprintf("Rp %s", formatNumber(*price)), "1", 1, "R", false, 0, "")
		} else {
			pdf.CellFormat(0, 7, "-", "1", 1, "L", false, 0, "")
		}
	}

	pdf.SetFont("A", "B", 10)
	pdf.Ln(5)
	pdf.CellFormat(0, 7, fmt.Sprintf("Total Nilai: Rp %s", formatNumber(totalValue)), "", 1, "R", false, 0, "")

	return h.outputPDF(c, pdf, fmt.Sprintf("laporan-kondisi-%s", condition))
}

func (h *ReportHandler) generateMaintenanceReport(c *echo.Context) error {
	pdf := gofpdf.New("L", "mm", "A4", "")
	pdf.SetAutoPageBreak(true, 15)
	pdf.AddPage()

	h.addReportHeader(pdf, "Laporan Riwayat Maintenance")

	rows, err := repository.DB.Query(`
		SELECT a.code, a.name, m.action_date, m.description, m.technician_name, m.cost
		FROM maintenance_logs m
		JOIN assets a ON m.asset_id = a.id
		ORDER BY m.action_date DESC
		LIMIT 100
	`)
	if err != nil {
		return c.JSON(http.StatusInternalServerError, map[string]string{"error": err.Error()})
	}
	defer rows.Close()

	h.addTableHeader(pdf, []string{"Kode Aset", "Nama Aset", "Tanggal", "Deskripsi", "Teknisi", "Biaya"})

	pdf.SetFont("A", "", 9)
	var totalCost float64
	for rows.Next() {
		var code, name, description, technician string
		var actionDate string
		var cost float64
		rows.Scan(&code, &name, &actionDate, &description, &technician, &cost)

		pdf.CellFormat(30, 7, h.truncate(code, 28), "1", 0, "L", false, 0, "")
		pdf.CellFormat(50, 7, h.truncate(name, 45), "1", 0, "L", false, 0, "")
		pdf.CellFormat(25, 7, actionDate[:10], "1", 0, "L", false, 0, "")
		pdf.CellFormat(60, 7, h.truncate(description, 55), "1", 0, "L", false, 0, "")
		pdf.CellFormat(40, 7, h.truncate(technician, 37), "1", 0, "L", false, 0, "")
		totalCost += cost
		pdf.CellFormat(0, 7, fmt.Sprintf("Rp %s", formatNumber(cost)), "1", 1, "R", false, 0, "")
	}

	pdf.SetFont("A", "B", 10)
	pdf.Ln(5)
	pdf.CellFormat(0, 7, fmt.Sprintf("Total Biaya Maintenance: Rp %s", formatNumber(totalCost)), "", 1, "R", false, 0, "")

	return h.outputPDF(c, pdf, "laporan-maintenance")
}

func (h *ReportHandler) addReportHeader(pdf *gofpdf.Fpdf, title string) {
	pdf.SetFont("A", "B", 16)
	pdf.CellFormat(0, 10, "LAB ASSET MANAGER", "", 1, "C", false, 0, "")

	pdf.SetFont("A", "", 10)
	pdf.CellFormat(0, 6, "Sistem Manajemen Aset Laboratorium", "", 1, "C", false, 0, "")

	pdf.Ln(3)
	pdf.SetFont("A", "B", 14)
	pdf.CellFormat(0, 8, title, "", 1, "C", false, 0, "")

	pdf.SetFont("A", "I", 9)
	pdf.CellFormat(0, 5, fmt.Sprintf("Dicetak: %s", time.Now().Format("02 January 2006, 15:04")), "", 1, "C", false, 0, "")

	pdf.Ln(5)
}

func (h *ReportHandler) addTableHeader(pdf *gofpdf.Fpdf, headers []string) {
	pdf.SetFont("A", "B", 10)
	pdf.SetFillColor(240, 240, 240)

	widths := []float64{30, 60, 40, 40, 30, 35}
	if len(headers) == 5 {
		widths = []float64{35, 80, 60, 40, 35}
	} else if len(headers) == 6 {
		widths = []float64{30, 50, 25, 60, 40, 35}
	}

	for i, header := range headers {
		var w float64
		if i < len(widths) {
			w = widths[i]
		} else {
			w = 35
		}
		pdf.CellFormat(w, 8, header, "1", 0, "C", true, 0, "")
	}
	pdf.Ln(-1)
}

func (h *ReportHandler) addConditionRow(pdf *gofpdf.Fpdf, label string, count int, color string) {
	pdf.SetFont("A", "", 11)
	pdf.CellFormat(60, 7, label, "0", 0, "L", false, 0, "")
	pdf.CellFormat(0, 7, fmt.Sprintf("%d unit", count), "0", 1, "L", false, 0, "")
}

func (h *ReportHandler) truncate(s string, maxLen int) string {
	runes := []rune(s)
	if len(runes) > maxLen {
		return string(runes[:maxLen-3]) + "..."
	}
	return s
}

func (h *ReportHandler) outputPDF(c *echo.Context, pdf *gofpdf.Fpdf, filename string) error {
	var buf bytes.Buffer
	if err := pdf.Output(&buf); err != nil {
		return c.JSON(http.StatusInternalServerError, map[string]string{"error": err.Error()})
	}

	c.Response().Header().Set("Content-Disposition", fmt.Sprintf("attachment; filename=%s.pdf", filename))
	c.Response().Header().Set("Content-Type", "application/pdf")

	return c.Blob(http.StatusOK, "application/pdf", buf.Bytes())
}

func formatNumber(n float64) string {
	return fmt.Sprintf("%.0f", n)
}
