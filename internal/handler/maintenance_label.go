package handler

import (
	"bytes"
	"fmt"
	"net/http"
	"os"
	"strconv"
	"strings"
	"time"

	"github.com/jung-kurt/gofpdf"
	"github.com/labstack/echo/v5"
	"lab-asset-manager/internal/repository"
)

type MaintenanceLabelHandler struct{}

func NewMaintenanceLabelHandler() *MaintenanceLabelHandler {
	return &MaintenanceLabelHandler{}
}

type MaintenanceLabelData struct {
	ID             int64
	AssetCode      string
	AssetName      string
	ActionDate     time.Time
	Description    string
	TechnicianName string
}

func (h *MaintenanceLabelHandler) GenerateLabel(c *echo.Context) error {
	maintLogIDStr := c.Param("id")

	var maintID int64
	var assetCode, assetName, description, technician string
	var actionDate time.Time
	var cost float64

	err := repository.DB.QueryRow(`
		SELECT m.id, a.code, a.name, m.description, m.technician_name, m.action_date, m.cost
		FROM maintenance_logs m
		JOIN assets a ON m.asset_id = a.id
		WHERE m.id = ?
	`, maintLogIDStr).Scan(&maintID, &assetCode, &assetName, &description, &technician, &actionDate, &cost)

	if err != nil {
		return c.JSON(http.StatusNotFound, map[string]string{"error": "Maintenance log not found"})
	}

	institutionName := os.Getenv("INSTITUTION_NAME")
	if institutionName == "" {
		institutionName = "LAB ASSET MANAGER"
	}

	pdf := gofpdf.New("P", "mm", "A4", "")
	pdf.SetMargins(10, 10, 10)
	pdf.AddPage()

	labelW := 50.0
	labelH := 30.0
	pageW, _ := pdf.GetPageSize()
	x := (pageW - labelW) / 2
	y := 50.0

	pdf.SetDrawColor(0, 0, 0)
	pdf.SetLineWidth(0.3)
	pdf.Rect(x, y, labelW, labelH, "D")

	pdf.SetFillColor(33, 150, 243)
	pdf.Rect(x, y, labelW, 5, "FD")
	pdf.SetFont("Arial", "B", 5)
	pdf.SetTextColor(255, 255, 255)
	pdf.SetXY(x+1, y+1)
	pdf.CellFormat(labelW-2, 3, institutionName, "", 0, "C", false, 0, "")

	pdf.SetTextColor(0, 0, 0)
	pdf.SetXY(x+1, y+5.5)
	pdf.SetFont("Arial", "B", 6)
	pdf.CellFormat(20, 3, "MAINTENANCE", "", 0, "L", false, 0, "")

	pdf.SetXY(x+labelW-15, y+5.5)
	pdf.SetFont("Arial", "", 4)
	pdf.CellFormat(14, 3, actionDate.Format("02/01/2006"), "", 0, "R", false, 0, "")

	pdf.SetXY(x+1, y+9)
	pdf.SetFont("Arial", "B", 5)
	pdf.CellFormat(labelW-2, 3, assetCode, "", 0, "C", false, 0, "")

	pdf.SetXY(x+1, y+12)
	pdf.SetFont("Arial", "", 4)
	truncatedName := assetName
	if len(truncatedName) > 30 {
		truncatedName = truncatedName[:30]
	}
	pdf.CellFormat(labelW-2, 3, truncatedName, "", 0, "C", false, 0, "")

	pdf.SetXY(x+1, y+15)
	pdf.SetFont("Arial", "", 3)
	if len(description) > 50 {
		description = description[:50]
	}
	pdf.CellFormat(labelW-2, 3, description, "", 0, "C", false, 0, "")

	pdf.SetXY(x+1, y+19)
	pdf.SetFont("Arial", "", 3)
	if technician != "" {
		pdf.CellFormat(24, 2.5, "Tech: "+technician, "", 0, "L", false, 0, "")
	}
	if cost > 0 {
		pdf.SetXY(x+labelW-15, y+19)
		pdf.CellFormat(14, 2.5, fmt.Sprintf("Rp %.0f", cost), "", 0, "R", false, 0, "")
	}

	pdf.SetXY(x+1, y+24)
	pdf.SetFont("Arial", "", 2.5)
	pdf.SetTextColor(128, 128, 128)
	pdf.CellFormat(labelW-2, 2.5, "ID: MAINT-"+fmt.Sprintf("%d", maintID), "", 0, "C", false, 0, "")

	var buf bytes.Buffer
	if err := pdf.Output(&buf); err != nil {
		return c.JSON(http.StatusInternalServerError, map[string]string{"error": err.Error()})
	}

	c.Response().Header().Set("Content-Disposition", fmt.Sprintf("attachment; filename=maintenance-%d.pdf", maintID))
	c.Response().Header().Set("Content-Type", "application/pdf")

	return c.Blob(http.StatusOK, "application/pdf", buf.Bytes())
}

func (h *MaintenanceLabelHandler) GenerateBulkLabels(c *echo.Context) error {
	idsParam := c.QueryParam("ids")
	if idsParam == "" {
		return c.JSON(http.StatusBadRequest, map[string]string{"error": "No IDs provided"})
	}

	idStrs := strings.Split(idsParam, ",")
	var ids []int64
	for _, idStr := range idStrs {
		id, err := strconv.ParseInt(strings.TrimSpace(idStr), 10, 64)
		if err != nil {
			continue
		}
		ids = append(ids, id)
	}

	if len(ids) == 0 {
		return c.JSON(http.StatusBadRequest, map[string]string{"error": "Invalid IDs"})
	}

	placeholders := make([]string, len(ids))
	args := make([]interface{}, len(ids))
	for i, id := range ids {
		placeholders[i] = "?"
		args[i] = id
	}

	query := fmt.Sprintf(`
		SELECT m.id, a.code, a.name, m.action_date, m.description, m.technician_name
		FROM maintenance_logs m
		JOIN assets a ON m.asset_id = a.id
		WHERE m.id IN (%s)
		ORDER BY m.action_date DESC
	`, strings.Join(placeholders, ","))

	rows, err := repository.DB.Query(query, args...)
	if err != nil {
		return c.JSON(http.StatusInternalServerError, map[string]string{"error": err.Error()})
	}
	defer rows.Close()

	var labels []MaintenanceLabelData
	for rows.Next() {
		var label MaintenanceLabelData
		if err := rows.Scan(&label.ID, &label.AssetCode, &label.AssetName, &label.ActionDate, &label.Description, &label.TechnicianName); err != nil {
			continue
		}
		labels = append(labels, label)
	}

	if len(labels) == 0 {
		return c.JSON(http.StatusNotFound, map[string]string{"error": "No maintenance logs found"})
	}

	institutionName := os.Getenv("INSTITUTION_NAME")
	if institutionName == "" {
		institutionName = "LAB ASSET MANAGER"
	}

	pdf := gofpdf.New("L", "mm", "A4", "")

	labelW := settings.MaintLabelWidth
	labelH := settings.MaintLabelHeight
	marginTop := settings.MaintLabelMarginTop
	marginLeft := settings.MaintLabelMarginLeft
	gapH := settings.MaintLabelGapH
	gapV := settings.MaintLabelGapV
	cols := settings.MaintLabelCols
	rowsPerPage := settings.MaintLabelRows
	fontSize := settings.MaintLabelFontSize

	pdf.SetMargins(0, 0, 0)
	pdf.AddPage()

	startX := marginLeft
	startY := marginTop

	for i, label := range labels {
		actualCol := i % cols
		actualRow := (i / cols) % rowsPerPage

		if actualCol == 0 && actualRow == 0 && i > 0 {
			pdf.AddPage()
		}

		x := startX + float64(actualCol)*(labelW+gapH)
		y := startY + float64(actualRow)*(labelH+gapV)

		pdf.SetDrawColor(0, 0, 0)
		pdf.SetLineWidth(0.2)
		pdf.Rect(x, y, labelW, labelH, "D")

		headerHeight := labelH * 0.2
		if headerHeight < 5 {
			headerHeight = 5
		}

		pdf.SetFillColor(0, 102, 204)
		pdf.Rect(x, y, labelW, headerHeight, "FD")
		pdf.SetFont("Arial", "B", fontSize+2)
		pdf.SetTextColor(255, 255, 255)
		pdf.SetXY(x+1, y+0.5)
		pdf.CellFormat(labelW-2, headerHeight-1, "KARTU PERAWATAN", "", 0, "C", false, 0, "")

		pdf.SetTextColor(0, 0, 0)
		pdf.SetXY(x+1, y+headerHeight+2)
		pdf.SetFont("Arial", "", fontSize)
		pdf.CellFormat(labelW-2, 4, label.ActionDate.Format("02/01/2006"), "", 0, "C", false, 0, "")

		pdf.SetXY(x+1, y+headerHeight+6)
		pdf.SetFont("Arial", "B", fontSize+2)
		truncatedCode := label.AssetCode
		if len(truncatedCode) > 20 {
			truncatedCode = truncatedCode[:20]
		}
		pdf.CellFormat(labelW-2, 4, truncatedCode, "", 0, "C", false, 0, "")

		pdf.SetXY(x+1, y+headerHeight+10)
		pdf.SetFont("Arial", "", fontSize)
		truncatedName := label.AssetName
		if len(truncatedName) > 25 {
			truncatedName = truncatedName[:25]
		}
		pdf.CellFormat(labelW-2, 4, truncatedName, "", 0, "C", false, 0, "")

		pdf.SetXY(x+1, y+headerHeight+14)
		pdf.SetFont("Arial", "", fontSize-1)
		desc := label.Description
		if len(desc) > 40 {
			desc = desc[:40]
		}
		pdf.CellFormat(labelW-2, 4, desc, "", 0, "C", false, 0, "")

		pdf.SetXY(x+1, y+headerHeight+18)
		pdf.SetFont("Arial", "", fontSize-1)
		pdf.CellFormat(labelW-2, 4, "Teknisi: "+label.TechnicianName, "", 0, "L", false, 0, "")

		pdf.SetXY(x+1, y+headerHeight+22)
		pdf.SetFont("Arial", "B", fontSize-1)
		pdf.CellFormat(labelW-2, 3, "ID: MAINT-"+fmt.Sprintf("%d", label.ID), "", 0, "L", false, 0, "")

		pdf.SetXY(x+1, y+labelH-4)
		pdf.SetFont("Arial", "", fontSize-2)
		pdf.SetTextColor(128, 128, 128)
		pdf.CellFormat(labelW-2, 2.5, institutionName, "", 0, "C", false, 0, "")
	}

	var buf bytes.Buffer
	if err := pdf.Output(&buf); err != nil {
		return c.JSON(http.StatusInternalServerError, map[string]string{"error": err.Error()})
	}

	c.Response().Header().Set("Content-Disposition", "attachment; filename=maintenance-labels.pdf")
	c.Response().Header().Set("Content-Type", "application/pdf")

	return c.Blob(http.StatusOK, "application/pdf", buf.Bytes())
}