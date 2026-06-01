package repository

import (
	"database/sql"
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
		created_at TIMESTAMP,
		updated_at TIMESTAMP
	)`
	_, err := r.db.Exec(query)
	return err
}

func (r *BahpRepository) Create(bahp *models.BahpDocument) error {
	query := `
		INSERT INTO bahp_documents (
			project_id, document_number, vendor_name, vendor_address, 
			catalog_url, initial_price, negotiated_price, shipping_cost, 
			screenshot_url, file_url, created_at, updated_at
		) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
		RETURNING id
	`
	now := time.Now()
	err := r.db.QueryRow(
		query, 
		bahp.ProjectID, bahp.DocumentNumber, bahp.VendorName, bahp.VendorAddress,
		bahp.CatalogURL, bahp.InitialPrice, bahp.NegotiatedPrice, bahp.ShippingCost,
		bahp.ScreenshotURL, bahp.FileURL, now, now,
	).Scan(&bahp.ID)
	return err
}

func (r *BahpRepository) GetByProjectID(projectID int64) (*models.BahpDocument, error) {
	query := `SELECT id, project_id, document_number, vendor_name, vendor_address, catalog_url, initial_price, negotiated_price, shipping_cost, screenshot_url, file_url, created_at, updated_at FROM bahp_documents WHERE project_id = $1`
	row := r.db.QueryRow(query, projectID)
	
	var bahp models.BahpDocument
	err := row.Scan(
		&bahp.ID, &bahp.ProjectID, &bahp.DocumentNumber, &bahp.VendorName, &bahp.VendorAddress,
		&bahp.CatalogURL, &bahp.InitialPrice, &bahp.NegotiatedPrice, &bahp.ShippingCost,
		&bahp.ScreenshotURL, &bahp.FileURL, &bahp.CreatedAt, &bahp.UpdatedAt,
	)
	if err != nil {
		if err == sql.ErrNoRows {
			return nil, nil // Not found is not necessarily an error here
		}
		return nil, err
	}
	return &bahp, nil
}
