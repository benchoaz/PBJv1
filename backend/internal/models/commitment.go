package models

import "time"

// BudgetCommitment records the earmarked budget when a project/DPP is finalized by PPK
type BudgetCommitment struct {
	ID              uint64    `gorm:"primaryKey;autoIncrement" json:"id"`
	ProjectID       uint64    `gorm:"index;not null" json:"project_id"`
	BudgetAccountID uint64    `gorm:"index;not null" json:"budget_account_id"`
	SatkerID        string    `gorm:"index;not null" json:"satker_id"`
	TahunAnggaran   int       `gorm:"not null" json:"tahun_anggaran"`
	NamaPaket       string    `gorm:"not null" json:"nama_paket"`
	NilaiKomitmen   float64   `gorm:"type:decimal(18,2);default:0" json:"nilai_komitmen"`
	CreatedAt       time.Time `json:"created_at"`
	UpdatedAt       time.Time `json:"updated_at"`
}
