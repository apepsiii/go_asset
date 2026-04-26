package service

import (
	"database/sql"
	"encoding/csv"
	"fmt"
	"io"
	"strconv"

	"lab-asset-manager/internal/repository"
)

func ExportAssetsCSV(w io.Writer) error {
	rows, err := repository.DB.Query(`
		SELECT a.id, a.code, a.name, a.specification, a.condition, a.purchase_date,
		       a.price, a.warranty_expiry, c.name, b.name, l.name
		FROM assets a
		LEFT JOIN categories c ON a.category_id = c.id
		LEFT JOIN budget_sources b ON a.budget_source_id = b.id
		LEFT JOIN locations l ON a.location_id = l.id
		ORDER BY a.code
	`)
	if err != nil {
		return err
	}
	defer rows.Close()

	writer := csv.NewWriter(w)
	defer writer.Flush()

	headers := []string{"ID", "Code", "Name", "Specification", "Condition", "Purchase Date", "Price", "Warranty Expiry", "Category", "Budget Source", "Location"}
	writer.Write(headers)

	for rows.Next() {
		var id int64
		var code, name, spec, condition, category, budgetSource, location string
		var purchaseDate, warrantyExpiry sql.NullTime
		var price sql.NullFloat64

		if err := rows.Scan(&id, &code, &name, &spec, &condition, &purchaseDate, &price, &warrantyExpiry, &category, &budgetSource, &location); err != nil {
			continue
		}

		record := []string{
			strconv.FormatInt(id, 10),
			code,
			name,
			spec,
			condition,
			formatDate(purchaseDate),
			formatPrice(price),
			formatDate(warrantyExpiry),
			category,
			budgetSource,
			location,
		}
		writer.Write(record)
	}

	return nil
}

func ImportAssetsCSV(r io.Reader, userID string) (*ImportResult, error) {
	reader := csv.NewReader(r)
	header, err := reader.Read()
	if err != nil {
		return nil, fmt.Errorf("failed to read CSV header: %w", err)
	}

	colMap := make(map[string]int)
	for i, h := range header {
		colMap[stripWhitespace(h)] = i
	}

	requiredCols := []string{"Code", "Name"}
	for _, col := range requiredCols {
		if _, ok := colMap[col]; !ok {
			return nil, fmt.Errorf("missing required column: %s", col)
		}
	}

	result := &ImportResult{}

	for {
		record, err := reader.Read()
		if err == io.EOF {
			break
		}
		if err != nil {
			result.Errors = append(result.Errors, fmt.Sprintf("Row %d: read error: %v", result.Total, err))
			continue
		}

		result.Total++

		code := getCol(record, colMap, "Code")
		name := getCol(record, colMap, "Name")

		if err := validateCode(code); err != nil {
			result.Errors = append(result.Errors, fmt.Sprintf("Row %d: invalid code: %v", result.Total, err))
			result.Failed++
			continue
		}
		if err := validateName(name); err != nil {
			result.Errors = append(result.Errors, fmt.Sprintf("Row %d: invalid name: %v", result.Total, err))
			result.Failed++
			continue
		}

		condition := getCol(record, colMap, "Condition")
		if condition == "" {
			condition = "OK"
		}
		if err := validateCondition(condition); err != nil {
			result.Errors = append(result.Errors, fmt.Sprintf("Row %d: invalid condition: %v", result.Total, err))
			result.Failed++
			continue
		}

		var price *float64
		priceStr := getCol(record, colMap, "Price")
		if priceStr != "" {
			p, err := strconv.ParseFloat(priceStr, 64)
			if err == nil {
				price = &p
			}
		}

		input := CreateAssetInput{
			Code:          code,
			Name:          name,
			Specification: getCol(record, colMap, "Specification"),
			Condition:     condition,
			Price:         price,
		}

		_, err = NewAssetService().Create(input)
		if err != nil {
			result.Errors = append(result.Errors, fmt.Sprintf("Row %d (%s): %v", result.Total, code, err))
			result.Failed++
			continue
		}

		RecordAudit(userID, string(AuditCreate), "asset", code, map[string]string{"source": "csv_import"}, "")
		result.Success++
	}

	return result, nil
}

type ImportResult struct {
	Total   int      `json:"total"`
	Success int      `json:"success"`
	Failed  int      `json:"failed"`
	Errors  []string `json:"errors"`
}

func formatDate(nt sql.NullTime) string {
	if !nt.Valid {
		return ""
	}
	return nt.Time.Format("2006-01-02")
}

func formatPrice(nf sql.NullFloat64) string {
	if !nf.Valid {
		return ""
	}
	return strconv.FormatFloat(nf.Float64, 'f', 2, 64)
}

func stripWhitespace(s string) string {
	result := make([]rune, 0, len(s))
	for _, r := range s {
		if r != ' ' && r != '\t' {
			result = append(result, r)
		}
	}
	return string(result)
}

func getCol(record []string, colMap map[string]int, name string) string {
	if idx, ok := colMap[name]; ok && idx < len(record) {
		return record[idx]
	}
	return ""
}
