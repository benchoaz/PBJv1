package models

import "time"

type BahpDocument struct {
	ID              int64     `json:"id" gorm:"primaryKey;autoIncrement"`
	ProjectID       int64     `json:"project_id"`
	DocumentNumber  string    `json:"document_number"`
	VendorName      string    `json:"vendor_name"`
	VendorAddress   string    `json:"vendor_address"`
	CatalogURL      string    `json:"catalog_url"`
	InitialPrice    float64   `json:"initial_price"`
	NegotiatedPrice float64   `json:"negotiated_price"`
	ShippingCost    float64   `json:"shipping_cost"`
	ScreenshotURL   string    `json:"screenshot_url"`
	FileURL         string    `json:"file_url"`
	CreatedAt       time.Time `json:"created_at" gorm:"autoCreateTime"`
	UpdatedAt       time.Time `json:"updated_at" gorm:"autoUpdateTime"`
}

type BahpCreate struct {
	DocumentNumber  string  `json:"document_number"`
	VendorName      string  `json:"vendor_name"`
	VendorAddress   string  `json:"vendor_address"`
	CatalogURL      string  `json:"catalog_url"`
	InitialPrice    float64 `json:"initial_price"`
	NegotiatedPrice float64 `json:"negotiated_price"`
	ShippingCost    float64 `json:"shipping_cost"`
	ScreenshotURL   string  `json:"screenshot_url"`
}
