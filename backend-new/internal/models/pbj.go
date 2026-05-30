package models

import (
	"time"
)

type StatusPaket string

const (
	StatusDraft      StatusPaket = "DRAFT"
	StatusSurveyed   StatusPaket = "SURVEYED"
	StatusDPPSigned  StatusPaket = "DPP_SIGNED"
)

type Package struct {
	ID        uint          `gorm:"primaryKey" json:"id"`
	SatkerID  string        `gorm:"index" json:"satker_id"`
	SiRUPID   string        `gorm:"index" json:"sirup_id"`
	NamaPaket string        `json:"nama_paket"`
	PaguTotal float64       `json:"pagu_total"`
	Status    StatusPaket   `gorm:"type:varchar(20);default:'DRAFT'" json:"status"`
	Mak       string        `json:"mak"`
	Items     []PackageItem `gorm:"foreignKey:PackageID;constraint:OnDelete:CASCADE;" json:"items"`
	CreatedAt time.Time     `json:"created_at"`
	UpdatedAt time.Time     `json:"updated_at"`
}

type PackageItem struct {
	ID              uint           `gorm:"primaryKey" json:"id"`
	PackageID       uint           `gorm:"index" json:"package_id"`
	NamaBarang      string         `json:"nama_barang"`
	Qty             float64        `json:"qty"`
	Satuan          string         `json:"satuan"`
	HargaPaguSatuan float64        `json:"harga_pagu_satuan"`
	NoUrut          int            `json:"no_urut"`
	Surveys         []SurveyResult `gorm:"foreignKey:PackageItemID;constraint:OnDelete:CASCADE;" json:"surveys"`
}

type SurveyResult struct {
	ID             uint    `gorm:"primaryKey" json:"id"`
	PackageItemID  uint    `gorm:"index" json:"package_item_id"`
	Vendor         string  `json:"vendor"`
	HargaEkatalog  float64 `json:"harga_ekatalog"`
	UrlProduk      string  `json:"url_produk"`
	ScreenshotPath string  `json:"screenshot_path"`
	IsSelected     bool    `json:"is_selected"`
	HargaHpsFinal  float64 `json:"harga_hps_final"`
	StatusSurvey   string  `json:"status_survey"`
}
