package service

import (
	"database/sql"
	"errors"
	"time"

	"lab-asset-manager/internal/models"
	"lab-asset-manager/internal/repository"
)

var (
	ErrAssetNotFound     = errors.New("asset not found")
	ErrAssetNotAvailable = errors.New("asset is not available for loan")
	ErrLoanNotFound      = errors.New("loan not found")
	ErrAlreadyReturned   = errors.New("asset has already been returned")
	ErrInvalidCondition  = errors.New("invalid condition value")
)

var loanValidConditions = map[string]bool{
	"OK": true, "RUSAK_RINGAN": true, "RUSAK_TOTAL": true, "MAINTENANCE": true,
}

type LoanService struct{}

func NewLoanService() *LoanService { return &LoanService{} }

type CreateLoanInput struct {
	AssetID         int64  `json:"asset_id"`
	BorrowerName    string `json:"borrower_name"`
	BorrowerContact string `json:"borrower_contact"`
	LoanDate        string `json:"loan_date"`
	DueDate         string `json:"due_date"`
	ConditionAtLoan string `json:"condition_at_loan"`
	Notes           string `json:"notes"`
	LoanerID        string `json:"loaner_id"`
}

type ReturnLoanInput struct {
	ReturnDate        string `json:"return_date"`
	ConditionAtReturn string `json:"condition_at_return"`
	Notes             string `json:"notes"`
}

type LoanWithAsset struct {
	Loan
	AssetCode string `json:"asset_code"`
	AssetName string `json:"asset_name"`
}

type Loan struct {
	ID                int64   `json:"id"`
	AssetID           int64   `json:"asset_id"`
	BorrowerName      string  `json:"borrower_name"`
	BorrowerContact   string  `json:"borrower_contact"`
	LoanDate          string  `json:"loan_date"`
	DueDate           string  `json:"due_date"`
	ReturnDate        *string `json:"return_date"`
	Status            string  `json:"status"`
	ConditionAtLoan   string  `json:"condition_at_loan"`
	ConditionAtReturn string  `json:"condition_at_return"`
	Notes             string  `json:"notes"`
	LoanerID          string  `json:"loaner_id"`
	CreatedAt         string  `json:"created_at"`
}

func (s *LoanService) Create(input CreateLoanInput) (*LoanWithAsset, error) {
	// Validate required fields
	if input.AssetID <= 0 {
		return nil, errors.New("asset_id is required")
	}
	if input.BorrowerName == "" {
		return nil, errors.New("borrower_name is required")
	}
	if input.LoanDate == "" {
		return nil, errors.New("loan_date is required")
	}
	if input.DueDate == "" {
		return nil, errors.New("due_date is required")
	}

	// Check if asset exists
	var exists bool
	err := repository.DB.QueryRow("SELECT EXISTS(SELECT 1 FROM assets WHERE id = ?)", input.AssetID).Scan(&exists)
	if err != nil || !exists {
		return nil, ErrAssetNotFound
	}

	// Check if asset is already on loan (not returned)
	var activeLoan int
	err = repository.DB.QueryRow(`
		SELECT COUNT(*) FROM loans 
		WHERE asset_id = ? AND status IN ('BORROWED', 'OVERDUE')
	`, input.AssetID).Scan(&activeLoan)
	if err != nil {
		return nil, err
	}
	if activeLoan > 0 {
		return nil, ErrAssetNotAvailable
	}

	// Default condition if not provided
	condition := input.ConditionAtLoan
	if condition == "" {
		condition = "OK"
	}

	now := time.Now().Format("2006-01-02T15:04:05Z07:00")
	if input.LoanerID == "" {
		input.LoanerID = "anonymous"
	}

	result, err := repository.DB.Exec(`
		INSERT INTO loans (asset_id, borrower_name, borrower_contact, loan_date, due_date, 
		                   condition_at_loan, notes, loaner_id, created_at)
		VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
	`, input.AssetID, input.BorrowerName, input.BorrowerContact, input.LoanDate, input.DueDate,
		condition, input.Notes, input.LoanerID, now)
	if err != nil {
		return nil, err
	}

	id, _ := result.LastInsertId()

	loan := &LoanWithAsset{
		Loan: Loan{
			ID:                id,
			AssetID:           input.AssetID,
			BorrowerName:      input.BorrowerName,
			BorrowerContact:   input.BorrowerContact,
			LoanDate:          input.LoanDate,
			DueDate:           input.DueDate,
			Status:            "BORROWED",
			ConditionAtLoan:   condition,
			ConditionAtReturn: "",
			Notes:             input.Notes,
			LoanerID:          input.LoanerID,
			CreatedAt:         now,
		},
	}

	// Get asset info
	repository.DB.QueryRow("SELECT code, name FROM assets WHERE id = ?", input.AssetID).Scan(&loan.AssetCode, &loan.AssetName)

	return loan, nil
}

func (s *LoanService) GetByID(id string) (*LoanWithAsset, error) {
	var loan LoanWithAsset
	var returnDate sql.NullString

	err := repository.DB.QueryRow(`
		SELECT l.id, l.asset_id, l.borrower_name, l.borrower_contact, l.loan_date, 
		       l.due_date, l.return_date, l.status, l.condition_at_loan, l.condition_at_return,
		       l.notes, l.loaner_id, l.created_at, a.code, a.name
		FROM loans l
		JOIN assets a ON l.asset_id = a.id
		WHERE l.id = ?
	`, id).Scan(
		&loan.ID, &loan.AssetID, &loan.BorrowerName, &loan.BorrowerContact,
		&loan.LoanDate, &loan.DueDate, &returnDate, &loan.Status,
		&loan.ConditionAtLoan, &loan.ConditionAtReturn, &loan.Notes, &loan.LoanerID,
		&loan.CreatedAt, &loan.AssetCode, &loan.AssetName,
	)
	if err == sql.ErrNoRows {
		return nil, ErrLoanNotFound
	}
	if err != nil {
		return nil, err
	}
	if returnDate.Valid {
		loan.ReturnDate = &returnDate.String
	}

	return &loan, nil
}

func (s *LoanService) GetAll(status, assetID string, limit int) ([]LoanWithAsset, error) {
	if limit <= 0 || limit > 100 {
		limit = 50
	}

	query := `
		SELECT l.id, l.asset_id, l.borrower_name, l.borrower_contact, l.loan_date,
		       l.due_date, l.return_date, l.status, l.condition_at_loan, l.condition_at_return,
		       l.notes, l.loaner_id, l.created_at, a.code, a.name
		FROM loans l
		JOIN assets a ON l.asset_id = a.id
		WHERE 1=1
	`
	args := []interface{}{}

	if status != "" {
		query += " AND l.status = ?"
		args = append(args, status)
	}
	if assetID != "" {
		query += " AND l.asset_id = ?"
		args = append(args, assetID)
	}

	query += " ORDER BY l.created_at DESC LIMIT ?"
	args = append(args, limit)

	rows, err := repository.DB.Query(query, args...)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var loans []LoanWithAsset
	for rows.Next() {
		var loan LoanWithAsset
		var returnDate sql.NullString
		err := rows.Scan(
			&loan.ID, &loan.AssetID, &loan.BorrowerName, &loan.BorrowerContact,
			&loan.LoanDate, &loan.DueDate, &returnDate, &loan.Status,
			&loan.ConditionAtLoan, &loan.ConditionAtReturn, &loan.Notes,
			&loan.LoanerID, &loan.CreatedAt, &loan.AssetCode, &loan.AssetName,
		)
		if err != nil {
			continue
		}
		if returnDate.Valid {
			loan.ReturnDate = &returnDate.String
		}
		loans = append(loans, loan)
	}

	if loans == nil {
		loans = []LoanWithAsset{}
	}
	return loans, nil
}

func (s *LoanService) Return(id string, input ReturnLoanInput) (*LoanWithAsset, error) {
	loan, err := s.GetByID(id)
	if err != nil {
		return nil, err
	}

	if loan.Status == "RETURNED" {
		return nil, ErrAlreadyReturned
	}

	// Validate condition
	condition := input.ConditionAtReturn
	if condition == "" {
		condition = loan.ConditionAtLoan
	}
	if !loanValidConditions[condition] {
		return nil, ErrInvalidCondition
	}

	returnDate := input.ReturnDate
	if returnDate == "" {
		returnDate = time.Now().Format("2006-01-02T15:04:05Z07:00")
	}

	notes := input.Notes
	if notes != "" {
		notes = loan.Notes + "\n[Return] " + notes
	}

	_, err = repository.DB.Exec(`
		UPDATE loans SET return_date = ?, status = 'RETURNED',
		                 condition_at_return = ?, notes = ?
		WHERE id = ?
	`, returnDate, condition, notes, id)
	if err != nil {
		return nil, err
	}

	// Update asset condition to match condition at return
	_, err = repository.DB.Exec(`
		UPDATE assets SET condition = ?, updated_at = CURRENT_TIMESTAMP
		WHERE id = ?
	`, condition, loan.AssetID)
	if err != nil {
		return nil, err
	}

	return s.GetByID(id)
}

func (s *LoanService) GetActiveLoans() ([]LoanWithAsset, error) {
	// Update overdue status first
	s.updateOverdueLoans()

	query := `
		SELECT l.id, l.asset_id, l.borrower_name, l.borrower_contact, l.loan_date,
		       l.due_date, l.return_date, l.status, l.condition_at_loan, l.condition_at_return,
		       l.notes, l.loaner_id, l.created_at, a.code, a.name
		FROM loans l
		JOIN assets a ON l.asset_id = a.id
		WHERE l.status IN ('BORROWED', 'OVERDUE')
		ORDER BY l.due_date ASC
	`

	rows, err := repository.DB.Query(query)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var loans []LoanWithAsset
	for rows.Next() {
		var loan LoanWithAsset
		var returnDate sql.NullString
		err := rows.Scan(
			&loan.ID, &loan.AssetID, &loan.BorrowerName, &loan.BorrowerContact,
			&loan.LoanDate, &loan.DueDate, &returnDate, &loan.Status,
			&loan.ConditionAtLoan, &loan.ConditionAtReturn, &loan.Notes,
			&loan.LoanerID, &loan.CreatedAt, &loan.AssetCode, &loan.AssetName,
		)
		if err != nil {
			continue
		}
		if returnDate.Valid {
			loan.ReturnDate = &returnDate.String
		}
		loans = append(loans, loan)
	}

	if loans == nil {
		loans = []LoanWithAsset{}
	}
	return loans, nil
}

func (s *LoanService) GetOverdueLoans() ([]LoanWithAsset, error) {
	s.updateOverdueLoans()

	query := `
		SELECT l.id, l.asset_id, l.borrower_name, l.borrower_contact, l.loan_date,
		       l.due_date, l.return_date, l.status, l.condition_at_loan, l.condition_at_return,
		       l.notes, l.loaner_id, l.created_at, a.code, a.name
		FROM loans l
		JOIN assets a ON l.asset_id = a.id
		WHERE l.status = 'OVERDUE'
		ORDER BY l.due_date ASC
	`

	rows, err := repository.DB.Query(query)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var loans []LoanWithAsset
	for rows.Next() {
		var loan LoanWithAsset
		var returnDate sql.NullString
		err := rows.Scan(
			&loan.ID, &loan.AssetID, &loan.BorrowerName, &loan.BorrowerContact,
			&loan.LoanDate, &loan.DueDate, &returnDate, &loan.Status,
			&loan.ConditionAtLoan, &loan.ConditionAtReturn, &loan.Notes,
			&loan.LoanerID, &loan.CreatedAt, &loan.AssetCode, &loan.AssetName,
		)
		if err != nil {
			continue
		}
		if returnDate.Valid {
			loan.ReturnDate = &returnDate.String
		}
		loans = append(loans, loan)
	}

	if loans == nil {
		loans = []LoanWithAsset{}
	}
	return loans, nil
}

func (s *LoanService) GetAvailableAssets() ([]models.Asset, error) {
	query := `
		SELECT a.id, a.category_id, a.budget_source_id, a.location_id, a.code, a.name,
		       a.specification, a.photo_url, a.condition, a.purchase_date, a.price,
		       a.warranty_expiry, a.created_at, a.updated_at
		FROM assets a
		WHERE a.id NOT IN (
			SELECT asset_id FROM loans WHERE status IN ('BORROWED', 'OVERDUE')
		)
		ORDER BY a.code
	`

	rows, err := repository.DB.Query(query)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var assets []models.Asset
	for rows.Next() {
		var a models.Asset
		var purchaseDate, warrantyExpiry sql.NullTime
		var spec, photoURL sql.NullString

		err := rows.Scan(
			&a.ID, &a.CategoryID, &a.BudgetSourceID, &a.LocationID,
			&a.Code, &a.Name, &spec, &photoURL, &a.Condition,
			&purchaseDate, &a.Price, &warrantyExpiry, &a.CreatedAt, &a.UpdatedAt,
		)
		if err != nil {
			continue
		}
		if spec.Valid {
			a.Specification = spec.String
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
		assets = append(assets, a)
	}

	if assets == nil {
		assets = []models.Asset{}
	}
	return assets, nil
}

func (s *LoanService) updateOverdueLoans() {
	now := time.Now().Format("2006-01-02T15:04:05Z07:00")
	repository.DB.Exec(`
		UPDATE loans SET status = 'OVERDUE'
		WHERE status = 'BORROWED' AND due_date < ?
	`, now)
}

func (s *LoanService) GetStats() (map[string]int, error) {
	stats := make(map[string]int)

	s.updateOverdueLoans()

	var active, overdue, returned, totalAssets, available int

	repository.DB.QueryRow("SELECT COUNT(*) FROM loans WHERE status IN ('BORROWED', 'OVERDUE')").Scan(&active)
	repository.DB.QueryRow("SELECT COUNT(*) FROM loans WHERE status = 'OVERDUE'").Scan(&overdue)
	repository.DB.QueryRow("SELECT COUNT(*) FROM loans WHERE status = 'RETURNED'").Scan(&returned)
	repository.DB.QueryRow("SELECT COUNT(*) FROM assets").Scan(&totalAssets)
	repository.DB.QueryRow(`
		SELECT COUNT(*) FROM assets a
		WHERE a.id NOT IN (SELECT asset_id FROM loans WHERE status IN ('BORROWED', 'OVERDUE'))
	`).Scan(&available)

	stats["active"] = active
	stats["overdue"] = overdue
	stats["returned"] = returned
	stats["total_assets"] = totalAssets
	stats["available"] = available

	return stats, nil
}
