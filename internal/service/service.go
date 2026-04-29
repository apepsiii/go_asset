package service

import (
	"database/sql"
	"encoding/json"
	"errors"
	"fmt"
	"strconv"
	"strings"
	"time"
	"unicode"

	"lab-asset-manager/internal/models"
	"lab-asset-manager/internal/repository"
)

var validConditions = map[string]bool{
	"OK": true, "RUSAK_RINGAN": true, "RUSAK_TOTAL": true, "MAINTENANCE": true,
}

func validateRequired(name, value string) error {
	if strings.TrimSpace(value) == "" {
		return fmt.Errorf("%s is required", name)
	}
	return nil
}

func validateName(name string) error {
	if err := validateRequired("Name", name); err != nil {
		return err
	}
	if len(name) < 2 {
		return errors.New("name must be at least 2 characters")
	}
	if len(name) > 100 {
		return errors.New("name must be at most 100 characters")
	}
	return nil
}

type CategoryService struct{}

func NewCategoryService() *CategoryService { return &CategoryService{} }

func (s *CategoryService) GetAll() ([]models.Category, error) {
	rows, err := repository.DB.Query("SELECT id, name, created_at FROM categories")
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var items []models.Category
	for rows.Next() {
		var cat models.Category
		if err := rows.Scan(&cat.ID, &cat.Name, &cat.CreatedAt); err != nil {
			continue
		}
		items = append(items, cat)
	}
	if items == nil {
		items = []models.Category{}
	}
	return items, nil
}

func (s *CategoryService) GetByID(id string) (*models.Category, error) {
	var cat models.Category
	err := repository.DB.QueryRow("SELECT id, name, created_at FROM categories WHERE id = ?", id).Scan(&cat.ID, &cat.Name, &cat.CreatedAt)
	if err == sql.ErrNoRows {
		return nil, errors.New("category not found")
	}
	if err != nil {
		return nil, err
	}
	return &cat, nil
}

func (s *CategoryService) Create(name string) (*models.Category, error) {
	if err := validateName(name); err != nil {
		return nil, err
	}
	result, err := repository.DB.Exec("INSERT INTO categories (name) VALUES (?)", name)
	if err != nil {
		return nil, err
	}
	id, _ := result.LastInsertId()
	return &models.Category{ID: id, Name: name, CreatedAt: time.Now()}, nil
}

func (s *CategoryService) Update(id, name string) error {
	if err := validateName(name); err != nil {
		return err
	}
	res, err := repository.DB.Exec("UPDATE categories SET name = ? WHERE id = ?", name, id)
	if err != nil {
		return err
	}
	n, _ := res.RowsAffected()
	if n == 0 {
		return errors.New("category not found")
	}
	return nil
}

func (s *CategoryService) Delete(id string) error {
	res, err := repository.DB.Exec("DELETE FROM categories WHERE id = ?", id)
	if err != nil {
		return err
	}
	n, _ := res.RowsAffected()
	if n == 0 {
		return errors.New("category not found")
	}
	return nil
}

type BudgetSourceService struct{}

func NewBudgetSourceService() *BudgetSourceService { return &BudgetSourceService{} }

func (s *BudgetSourceService) GetAll() ([]models.BudgetSource, error) {
	rows, err := repository.DB.Query("SELECT id, name, created_at FROM budget_sources")
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var items []models.BudgetSource
	for rows.Next() {
		var item models.BudgetSource
		if err := rows.Scan(&item.ID, &item.Name, &item.CreatedAt); err != nil {
			continue
		}
		items = append(items, item)
	}
	if items == nil {
		items = []models.BudgetSource{}
	}
	return items, nil
}

func (s *BudgetSourceService) GetByID(id string) (*models.BudgetSource, error) {
	var item models.BudgetSource
	err := repository.DB.QueryRow("SELECT id, name, created_at FROM budget_sources WHERE id = ?", id).Scan(&item.ID, &item.Name, &item.CreatedAt)
	if err == sql.ErrNoRows {
		return nil, errors.New("budget source not found")
	}
	if err != nil {
		return nil, err
	}
	return &item, nil
}

func (s *BudgetSourceService) Create(name string) (*models.BudgetSource, error) {
	if err := validateName(name); err != nil {
		return nil, err
	}
	result, err := repository.DB.Exec("INSERT INTO budget_sources (name) VALUES (?)", name)
	if err != nil {
		return nil, err
	}
	id, _ := result.LastInsertId()
	return &models.BudgetSource{ID: id, Name: name, CreatedAt: time.Now()}, nil
}

func (s *BudgetSourceService) Update(id, name string) error {
	if err := validateName(name); err != nil {
		return err
	}
	res, err := repository.DB.Exec("UPDATE budget_sources SET name = ? WHERE id = ?", name, id)
	if err != nil {
		return err
	}
	n, _ := res.RowsAffected()
	if n == 0 {
		return errors.New("budget source not found")
	}
	return nil
}

func (s *BudgetSourceService) Delete(id string) error {
	res, err := repository.DB.Exec("DELETE FROM budget_sources WHERE id = ?", id)
	if err != nil {
		return err
	}
	n, _ := res.RowsAffected()
	if n == 0 {
		return errors.New("budget source not found")
	}
	return nil
}

type LocationService struct{}

func NewLocationService() *LocationService { return &LocationService{} }

func (s *LocationService) GetAll() ([]models.Location, error) {
	rows, err := repository.DB.Query("SELECT id, name, created_at FROM locations")
	if err != nil {
		return nil, err
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
	return items, nil
}

func (s *LocationService) GetByID(id string) (*models.Location, error) {
	var item models.Location
	err := repository.DB.QueryRow("SELECT id, name, created_at FROM locations WHERE id = ?", id).Scan(&item.ID, &item.Name, &item.CreatedAt)
	if err == sql.ErrNoRows {
		return nil, errors.New("location not found")
	}
	if err != nil {
		return nil, err
	}
	return &item, nil
}

func (s *LocationService) Create(name string) (*models.Location, error) {
	if err := validateName(name); err != nil {
		return nil, err
	}
	result, err := repository.DB.Exec("INSERT INTO locations (name) VALUES (?)", name)
	if err != nil {
		return nil, err
	}
	id, _ := result.LastInsertId()
	return &models.Location{ID: id, Name: name, CreatedAt: time.Now()}, nil
}

func (s *LocationService) Update(id, name string) error {
	if err := validateName(name); err != nil {
		return err
	}
	res, err := repository.DB.Exec("UPDATE locations SET name = ? WHERE id = ?", name, id)
	if err != nil {
		return err
	}
	n, _ := res.RowsAffected()
	if n == 0 {
		return errors.New("location not found")
	}
	return nil
}

func (s *LocationService) Delete(id string) error {
	res, err := repository.DB.Exec("DELETE FROM locations WHERE id = ?", id)
	if err != nil {
		return err
	}
	n, _ := res.RowsAffected()
	if n == 0 {
		return errors.New("location not found")
	}
	return nil
}

type AssetService struct{}

func NewAssetService() *AssetService { return &AssetService{} }

func validateCode(code string) error {
	if err := validateRequired("Code", code); err != nil {
		return err
	}
	for _, r := range code {
		if !unicode.IsLetter(r) && !unicode.IsDigit(r) && r != '-' && r != '_' {
			return errors.New("code can only contain letters, digits, hyphens, and underscores")
		}
	}
	return nil
}

func validateCondition(cond string) error {
	if cond == "" {
		return nil
	}
	if !validConditions[cond] {
		return fmt.Errorf("invalid condition: must be one of OK, RUSAK_RINGAN, RUSAK_TOTAL, MAINTENANCE")
	}
	return nil
}

func scanAsset(scanner interface{ Scan(...interface{}) error }) (*models.Asset, error) {
	var a models.Asset
	var purchaseDate, warrantyExpiry sql.NullTime
	var spec, photoURL, specifications sql.NullString

	err := scanner.Scan(
		&a.ID, &a.CategoryID, &a.BudgetSourceID, &a.LocationID,
		&a.Code, &a.Name, &spec, &specifications, &photoURL, &a.Condition,
		&purchaseDate, &a.Price, &warrantyExpiry, &a.UsefulLifeYears, &a.SalvageValue,
		&a.CreatedAt, &a.UpdatedAt,
	)
	if err != nil {
		return nil, err
	}
	if spec.Valid {
		a.Specification = spec.String
	}
	if specifications.Valid {
		a.Specifications = json.RawMessage(specifications.String)
	}
	if photoURL.Valid {
		a.PhotoURL = photoURL.String
	}
	if purchaseDate.Valid {
		a.PurchaseDate = &purchaseDate.Time
	}
	if warrantyExpiry.Valid {
		a.WarrantyExpiry = &warrantyExpiry.Time
	}
	return &a, nil
}

func (s *AssetService) GetAll() ([]models.Asset, error) {
	rows, err := repository.DB.Query(`
		SELECT id, category_id, budget_source_id, location_id, code, name,
		       specification, specifications, photo_url, condition, purchase_date, price,
		       warranty_expiry, useful_life_years, salvage_value, created_at, updated_at
		FROM assets
	`)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var assets []models.Asset
	for rows.Next() {
		a, err := scanAsset(rows)
		if err != nil {
			continue
		}
		assets = append(assets, *a)
	}
	if assets == nil {
		assets = []models.Asset{}
	}
	return assets, nil
}

func (s *AssetService) GetByID(id string) (*models.Asset, error) {
	a, err := scanAsset(
		repository.DB.QueryRow(`
			SELECT id, category_id, budget_source_id, location_id, code, name,
			       specification, specifications, photo_url, condition, purchase_date, price,
			       warranty_expiry, useful_life_years, salvage_value, created_at, updated_at
			FROM assets WHERE id = ?
		`, id),
	)
	if err == sql.ErrNoRows {
		return nil, errors.New("asset not found")
	}
	if err != nil {
		return nil, err
	}
	return a, nil
}

type CreateAssetInput struct {
	CategoryID      *int64          `json:"category_id"`
	BudgetSourceID  *int64          `json:"budget_source_id"`
	LocationID      *int64          `json:"location_id"`
	Code            string          `json:"code"`
	Name            string          `json:"name"`
	Specification   string          `json:"specification"`
	Specifications  json.RawMessage `json:"specifications"`
	PhotoURL        string          `json:"photo_url"`
	Condition       string          `json:"condition"`
	PurchaseDate    *time.Time      `json:"purchase_date"`
	Price           *float64        `json:"price"`
	WarrantyExpiry  *time.Time      `json:"warranty_expiry"`
	UsefulLifeYears int             `json:"useful_life_years"`
	SalvageValue    float64         `json:"salvage_value"`
}

type UpdateAssetInput struct {
	CategoryID      *int64          `json:"category_id"`
	BudgetSourceID  *int64          `json:"budget_source_id"`
	LocationID      *int64          `json:"location_id"`
	Code            string          `json:"code"`
	Name            string          `json:"name"`
	Specification   string          `json:"specification"`
	Specifications  json.RawMessage `json:"specifications"`
	PhotoURL        string          `json:"photo_url"`
	Condition       string          `json:"condition"`
	PurchaseDate    *time.Time      `json:"purchase_date"`
	Price           *float64        `json:"price"`
	WarrantyExpiry  *time.Time      `json:"warranty_expiry"`
	UsefulLifeYears *int            `json:"useful_life_years"`
	SalvageValue    *float64        `json:"salvage_value"`
}

func (s *AssetService) Create(input CreateAssetInput) (*models.Asset, error) {
	if err := validateCode(input.Code); err != nil {
		return nil, err
	}
	if err := validateName(input.Name); err != nil {
		return nil, err
	}
	if err := validateCondition(input.Condition); err != nil {
		return nil, err
	}
	if input.Condition == "" {
		input.Condition = "OK"
	}
	if input.UsefulLifeYears == 0 {
		input.UsefulLifeYears = 5 // Default 5 years
	}

	result, err := repository.DB.Exec(`
		INSERT INTO assets (category_id, budget_source_id, location_id, code, name,
		                     specification, specifications, photo_url, condition, purchase_date, price, warranty_expiry,
		                     useful_life_years, salvage_value)
		VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
	`, input.CategoryID, input.BudgetSourceID, input.LocationID, input.Code, input.Name,
		input.Specification, string(input.Specifications), input.PhotoURL, input.Condition, input.PurchaseDate, input.Price,
		input.WarrantyExpiry, input.UsefulLifeYears, input.SalvageValue)
	if err != nil {
		return nil, err
	}

	id, _ := result.LastInsertId()
	now := time.Now()
	return &models.Asset{
		ID: id, CategoryID: input.CategoryID, BudgetSourceID: input.BudgetSourceID,
		LocationID: input.LocationID, Code: input.Code, Name: input.Name,
		Specification: input.Specification, Specifications: input.Specifications, PhotoURL: input.PhotoURL, Condition: input.Condition,
		PurchaseDate: input.PurchaseDate, Price: input.Price, WarrantyExpiry: input.WarrantyExpiry,
		UsefulLifeYears: input.UsefulLifeYears, SalvageValue: input.SalvageValue,
		CreatedAt: now, UpdatedAt: now,
	}, nil
}

func (s *AssetService) Update(id string, input UpdateAssetInput) error {
	// Validate if id is provided and valid
	if id == "" {
		return errors.New("asset id is required")
	}

	// Only validate if fields are being updated
	if input.Code != "" {
		if err := validateCode(input.Code); err != nil {
			return err
		}
	}
	if input.Name != "" {
		if err := validateName(input.Name); err != nil {
			return err
		}
	}
	if input.Condition != "" {
		if err := validateCondition(input.Condition); err != nil {
			return err
		}
	}

	// Build dynamic UPDATE query
	query := `UPDATE assets SET
		category_id = ?, budget_source_id = ?, location_id = ?,
		code = ?, name = ?, specification = ?, specifications = ?, photo_url = ?,
		condition = ?, purchase_date = ?, price = ?, warranty_expiry = ?,
		updated_at = CURRENT_TIMESTAMP`

	args := []interface{}{
		input.CategoryID, input.BudgetSourceID, input.LocationID,
		input.Code, input.Name, input.Specification, string(input.Specifications), input.PhotoURL,
		input.Condition, input.PurchaseDate, input.Price, input.WarrantyExpiry,
	}

	if input.UsefulLifeYears != nil {
		query += `, useful_life_years = ?`
		args = append(args, *input.UsefulLifeYears)
	}
	if input.SalvageValue != nil {
		query += `, salvage_value = ?`
		args = append(args, *input.SalvageValue)
	}

	query += ` WHERE id = ?`
	args = append(args, id)

	res, err := repository.DB.Exec(query, args...)
	if err != nil {
		return err
	}
	n, _ := res.RowsAffected()
	if n == 0 {
		return errors.New("asset not found or no changes made")
	}
	return nil
}

func (s *AssetService) Delete(id string) error {
	res, err := repository.DB.Exec("DELETE FROM assets WHERE id = ?", id)
	if err != nil {
		return err
	}
	n, _ := res.RowsAffected()
	if n == 0 {
		return errors.New("asset not found")
	}
	return nil
}

type MaintenanceLogService struct{}

func NewMaintenanceLogService() *MaintenanceLogService { return &MaintenanceLogService{} }

func (s *MaintenanceLogService) GetByAssetID(assetID string) ([]models.MaintenanceLog, error) {
	rows, err := repository.DB.Query(`
		SELECT id, asset_id, action_date, description, technician_name, cost
		FROM maintenance_logs WHERE asset_id = ? ORDER BY action_date DESC
	`, assetID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var logs []models.MaintenanceLog
	for rows.Next() {
		var log models.MaintenanceLog
		if err := rows.Scan(&log.ID, &log.AssetID, &log.ActionDate, &log.Description, &log.TechnicianName, &log.Cost); err != nil {
			continue
		}
		logs = append(logs, log)
	}
	if logs == nil {
		logs = []models.MaintenanceLog{}
	}
	return logs, nil
}

func (s *MaintenanceLogService) GetAll() ([]models.MaintenanceLogWithAsset, error) {
	rows, err := repository.DB.Query(`
		SELECT m.id, m.asset_id, a.code, a.name, m.action_date, m.description, m.technician_name, m.cost
		FROM maintenance_logs m
		JOIN assets a ON m.asset_id = a.id
		ORDER BY m.action_date DESC
	`)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var logs []models.MaintenanceLogWithAsset
	for rows.Next() {
		var log models.MaintenanceLogWithAsset
		if err := rows.Scan(&log.ID, &log.AssetID, &log.AssetCode, &log.AssetName, &log.ActionDate, &log.Description, &log.TechnicianName, &log.Cost); err != nil {
			continue
		}
		logs = append(logs, log)
	}
	if logs == nil {
		logs = []models.MaintenanceLogWithAsset{}
	}
	return logs, nil
}

type CreateMaintenanceLogInput struct {
	ActionDate     time.Time `json:"action_date"`
	Description    string    `json:"description"`
	TechnicianName string    `json:"technician_name"`
	Cost           float64   `json:"cost"`
}

func (s *MaintenanceLogService) Create(assetID string, input CreateMaintenanceLogInput) (*models.MaintenanceLog, error) {
	if input.ActionDate.IsZero() {
		input.ActionDate = time.Now()
	}

	result, err := repository.DB.Exec(`
		INSERT INTO maintenance_logs (asset_id, action_date, description, technician_name, cost)
		VALUES (?, ?, ?, ?, ?)
	`, assetID, input.ActionDate, input.Description, input.TechnicianName, input.Cost)
	if err != nil {
		return nil, err
	}

	id, _ := result.LastInsertId()
	aid, _ := strconv.ParseInt(assetID, 10, 64)
	return &models.MaintenanceLog{ID: id, AssetID: aid, ActionDate: input.ActionDate, Description: input.Description, TechnicianName: input.TechnicianName, Cost: input.Cost}, nil
}

func (s *MaintenanceLogService) Delete(id string) error {
	res, err := repository.DB.Exec("DELETE FROM maintenance_logs WHERE id = ?", id)
	if err != nil {
		return err
	}
	n, _ := res.RowsAffected()
	if n == 0 {
		return errors.New("maintenance log not found")
	}
	return nil
}

type UpgradeLogService struct{}

func NewUpgradeLogService() *UpgradeLogService { return &UpgradeLogService{} }

func (s *UpgradeLogService) GetByAssetID(assetID string) ([]models.UpgradeLog, error) {
	rows, err := repository.DB.Query(`
		SELECT id, asset_id, upgrade_date, description
		FROM upgrade_logs WHERE asset_id = ? ORDER BY upgrade_date DESC
	`, assetID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var logs []models.UpgradeLog
	for rows.Next() {
		var log models.UpgradeLog
		if err := rows.Scan(&log.ID, &log.AssetID, &log.UpgradeDate, &log.Description); err != nil {
			continue
		}
		logs = append(logs, log)
	}
	if logs == nil {
		logs = []models.UpgradeLog{}
	}
	return logs, nil
}

type CreateUpgradeLogInput struct {
	UpgradeDate time.Time `json:"upgrade_date"`
	Description string    `json:"description"`
}

func (s *UpgradeLogService) Create(assetID string, input CreateUpgradeLogInput) (*models.UpgradeLog, error) {
	if input.UpgradeDate.IsZero() {
		input.UpgradeDate = time.Now()
	}

	result, err := repository.DB.Exec(`
		INSERT INTO upgrade_logs (asset_id, upgrade_date, description)
		VALUES (?, ?, ?)
	`, assetID, input.UpgradeDate, input.Description)
	if err != nil {
		return nil, err
	}

	id, _ := result.LastInsertId()
	aid, _ := strconv.ParseInt(assetID, 10, 64)
	return &models.UpgradeLog{ID: id, AssetID: aid, UpgradeDate: input.UpgradeDate, Description: input.Description}, nil
}

func (s *UpgradeLogService) Delete(id string) error {
	res, err := repository.DB.Exec("DELETE FROM upgrade_logs WHERE id = ?", id)
	if err != nil {
		return err
	}
	n, _ := res.RowsAffected()
	if n == 0 {
		return errors.New("upgrade log not found")
	}
	return nil
}
