package models

import "time"

type VendorLocation struct {
	ID          uint      `gorm:"primaryKey;autoIncrement" json:"id"`
	VendorName  string    `gorm:"uniqueIndex;not null" json:"vendor_name"`
	Subdistrict string    `gorm:"not null" json:"subdistrict"`
	UpdatedAt   time.Time `gorm:"autoUpdateTime" json:"updated_at"`
}
