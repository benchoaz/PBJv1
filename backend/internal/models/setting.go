package models

import "time"

type AppSetting struct {
	Key       string    `gorm:"primaryKey" json:"key"`
	Value     string    `json:"value"`
	UpdatedAt time.Time `gorm:"autoUpdateTime" json:"updated_at"`
}

type SettingRequest struct {
	Key   string `json:"key"`
	Value string `json:"value"`
}
