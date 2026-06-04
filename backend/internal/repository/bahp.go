package repository

import (
	"database/sql"
	"encoding/json"
	"pbj/internal/models"
	"time"
)

type BahpRepository struct {
	db *sql.DB
}

func NewBahpRepository(db *sql.DB) *BahpRepository {
	return &BahpRepository{db: db}
}

func (r *BahpRepository) Initialize() error {
	// Create table with new columns
	query := `
	CREATE TABLE IF NOT EXISTS bahp_documents (
		id SERIAL PRIMARY KEY,
		project_id INTEGER,
		document_number TEXT UNIQUE,
		vendor_name TEXT,
		vendor_address TEXT,
		catalog_url TEXT,
		initial_price REAL,
		negotiated_price REAL,
		shipping_cost REAL,
		screenshot_url TEXT,
		file_url TEXT,
		items_json TEXT DEFAULT '[]',
		package_type TEXT DEFAULT 'ATK',
		delivery_location TEXT DEFAULT '',
		has_exceptions INTEGER DEFAULT 0,
		exception_notes TEXT DEFAULT '',
		ppk_approved_continue INTEGER DEFAULT 0,
		status TEXT DEFAULT 'Draft',
		created_at TIMESTAMP,
		updated_at TIMESTAMP
	)`
	_, err := r.db.Exec(query)
	if err != nil {
		return err
	}

	// Add new columns to existing table if they don't exist (migration)
	migrations := []string{
		`ALTER TABLE bahp_documents ADD COLUMN items_json TEXT DEFAULT '[]'`,
		`ALTER TABLE bahp_documents ADD COLUMN package_type TEXT DEFAULT 'ATK'`,
		`ALTER TABLE bahp_documents ADD COLUMN delivery_location TEXT DEFAULT ''`,
		`ALTER TABLE bahp_documents ADD COLUMN has_exceptions INTEGER DEFAULT 0`,
		`ALTER TABLE bahp_documents ADD COLUMN exception_notes TEXT DEFAULT ''`,
		`ALTER TABLE bahp_documents ADD COLUMN ppk_approved_continue INTEGER DEFAULT 0`,
		`ALTER TABLE bahp_documents ADD COLUMN status TEXT DEFAULT 'Draft'`,
	}
	for _, m := range migrations {
		r.db.Exec(m) // ignore errors (column may already exist)
	}

	return nil
}

func (r *BahpRepository) Create(bahp *models.BahpDocument) error {
	query := `
		INSERT INTO bahp_documents (
			project_id, document_number, vendor_name, vendor_address, 
			catalog_url, initial_price, negotiated_price, shipping_cost, 
			screenshot_url, file_url,
			items_json, package_type, delivery_location,
			has_exceptions, exception_notes, ppk_approved_continue, status,
			created_at, updated_at
		) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19)
		ON CONFLICT(document_number) DO UPDATE SET
			vendor_name=excluded.vendor_name,
			items_json=excluded.items_json,
			package_type=excluded.package_type,
			delivery_location=excluded.delivery_location,
			has_exceptions=excluded.has_exceptions,
			exception_notes=excluded.exception_notes,
			ppk_approved_continue=excluded.ppk_approved_continue,
			status=excluded.status,
			updated_at=excluded.updated_at
	`
	now := time.Now()
	hasExceptionsInt := 0
	if bahp.HasExceptions {
		hasExceptionsInt = 1
	}
	ppkApprovedInt := 0
	if bahp.PPKApprovedContinue {
		ppkApprovedInt = 1
	}
	result, err := r.db.Exec(
		query,
		bahp.ProjectID, bahp.DocumentNumber, bahp.VendorName, bahp.VendorAddress,
		bahp.CatalogURL, bahp.InitialPrice, bahp.NegotiatedPrice, bahp.ShippingCost,
		bahp.ScreenshotURL, bahp.FileURL,
		bahp.ItemsJSON, bahp.PackageType, bahp.DeliveryLocation,
		hasExceptionsInt, bahp.ExceptionNotes, ppkApprovedInt, bahp.Status,
		now, now,
	)
	if err != nil {
		return err
	}
	id, err := result.LastInsertId()
	if err == nil {
		bahp.ID = id
	}
	return nil
}

func (r *BahpRepository) GetByProjectID(projectID int64) (*models.BahpDocument, error) {
	query := `SELECT id, project_id, document_number, vendor_name, vendor_address, catalog_url, 
		initial_price, negotiated_price, shipping_cost, screenshot_url, file_url,
		COALESCE(items_json,'[]'), COALESCE(package_type,'ATK'), COALESCE(delivery_location,''),
		COALESCE(has_exceptions,0), COALESCE(exception_notes,''), COALESCE(ppk_approved_continue,0),
		COALESCE(status,'Draft'), created_at, updated_at 
		FROM bahp_documents WHERE project_id = $1 ORDER BY id DESC LIMIT 1`
	row := r.db.QueryRow(query, projectID)

	var bahp models.BahpDocument
	var hasExceptionsInt, ppkApprovedInt int
	err := row.Scan(
		&bahp.ID, &bahp.ProjectID, &bahp.DocumentNumber, &bahp.VendorName, &bahp.VendorAddress,
		&bahp.CatalogURL, &bahp.InitialPrice, &bahp.NegotiatedPrice, &bahp.ShippingCost,
		&bahp.ScreenshotURL, &bahp.FileURL,
		&bahp.ItemsJSON, &bahp.PackageType, &bahp.DeliveryLocation,
		&hasExceptionsInt, &bahp.ExceptionNotes, &ppkApprovedInt,
		&bahp.Status, &bahp.CreatedAt, &bahp.UpdatedAt,
	)
	if err != nil {
		if err == sql.ErrNoRows {
			return nil, nil
		}
		return nil, err
	}
	bahp.HasExceptions = hasExceptionsInt == 1
	bahp.PPKApprovedContinue = ppkApprovedInt == 1
	return &bahp, nil
}

// ParseItems parses ItemsJSON into a slice of BahpItem
func ParseBahpItems(itemsJSON string) ([]models.BahpItem, error) {
	var items []models.BahpItem
	if itemsJSON == "" || itemsJSON == "[]" {
		return items, nil
	}
	err := json.Unmarshal([]byte(itemsJSON), &items)
	return items, err
}
