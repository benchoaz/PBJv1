package models

import "time"

type ProjectAddendum struct {
	ID             int64     `json:"id" gorm:"primaryKey;autoIncrement"`
	ProjectID      int64     `json:"project_id" gorm:"index"`
	BAHPDocumentID int64     `json:"bahp_document_id" gorm:"index"`
	DocumentNumber string    `json:"document_number"`
	Justification  string    `json:"justification"`   // Alasan perubahan/hukum adendum
	ItemsJSON      string    `json:"items_json"`      // JSON array of BahpItem (rincian item baru/revisi)
	Status         string    `json:"status"`          // "Draft", "Verifikasi PP", "Disetujui PP", "Selesai"
	PPKApproved    bool      `json:"ppk_approved"`    // Persetujuan PPK
	PPApproved     bool      `json:"pp_approved"`     // Persetujuan PP
	CreatedAt      time.Time `json:"created_at" gorm:"autoCreateTime"`
	UpdatedAt      time.Time `json:"updated_at" gorm:"autoUpdateTime"`
}
