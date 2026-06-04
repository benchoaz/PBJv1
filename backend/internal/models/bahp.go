package models

import "time"

// BahpItem represents a single item line in the BAHP document
type BahpItem struct {
	ItemName         string  `json:"item_name"`
	Qty              float64 `json:"qty"`               // Qty dari DPP
	QtyConfirmed     float64 `json:"qty_confirmed"`      // Qty yang bisa dipenuhi (bisa < qty)
	Unit             string  `json:"unit"`
	VendorName       string  `json:"vendor_name"`
	CatalogURL       string  `json:"catalog_url"`
	ScreenshotURL    string  `json:"screenshot_url"`
	InitialPrice     float64 `json:"initial_price"`      // Harga Tayang Katalog
	NegotiatedPrice  float64 `json:"negotiated_price"`   // Harga hasil nego
	ShippingCost     float64 `json:"shipping_cost"`
	Status           string  `json:"status"`             // "Tersedia" | "Stok Kurang" | "Tidak Tersedia"
	PPNotes          string  `json:"pp_notes"`           // Catatan PP jika ada masalah
	// Comparator
	ComparatorVendor string  `json:"comparator_vendor"`
	ComparatorPrice  float64 `json:"comparator_price"`
	ComparatorURL    string  `json:"comparator_url"`
}

type BahpDocument struct {
	ID                  int64     `json:"id" gorm:"primaryKey;autoIncrement"`
	ProjectID           int64     `json:"project_id"`
	DocumentNumber      string    `json:"document_number"`
	// Legacy single-vendor fields (kept for backward compat)
	VendorName          string    `json:"vendor_name"`
	VendorAddress       string    `json:"vendor_address"`
	CatalogURL          string    `json:"catalog_url"`
	InitialPrice        float64   `json:"initial_price"`
	NegotiatedPrice     float64   `json:"negotiated_price"`
	ShippingCost        float64   `json:"shipping_cost"`
	ScreenshotURL       string    `json:"screenshot_url"`
	FileURL             string    `json:"file_url"`
	// New multi-item fields
	ItemsJSON           string    `json:"items_json"`            // JSON array of BahpItem
	PackageType         string    `json:"package_type"`          // ATK, Mamin, Jasa, Modal
	DeliveryLocation    string    `json:"delivery_location"`     // Lokasi pengiriman
	HasExceptions       bool      `json:"has_exceptions"`        // True jika ada item bermasalah
	ExceptionNotes      string    `json:"exception_notes"`       // Catatan Penyimpangan DPP resmi
	PPKApprovedContinue bool      `json:"ppk_approved_continue"` // True jika PPK approve tetap lanjut
	Status              string    `json:"status"`                // "Draft" | "Final"
	CreatedAt           time.Time `json:"created_at" gorm:"autoCreateTime"`
	UpdatedAt           time.Time `json:"updated_at" gorm:"autoUpdateTime"`
}

type BahpCreate struct {
	DocumentNumber      string     `json:"document_number"`
	// Legacy single-vendor fields
	VendorName          string     `json:"vendor_name"`
	VendorAddress       string     `json:"vendor_address"`
	CatalogURL          string     `json:"catalog_url"`
	InitialPrice        float64    `json:"initial_price"`
	NegotiatedPrice     float64    `json:"negotiated_price"`
	ShippingCost        float64    `json:"shipping_cost"`
	ScreenshotURL       string     `json:"screenshot_url"`
	// New multi-item fields
	Items               []BahpItem `json:"items"`
	PackageType         string     `json:"package_type"`
	DeliveryLocation    string     `json:"delivery_location"`
	HasExceptions       bool       `json:"has_exceptions"`
	ExceptionNotes      string     `json:"exception_notes"`
	PPKApprovedContinue bool       `json:"ppk_approved_continue"`
	Status              string     `json:"status"`
}
