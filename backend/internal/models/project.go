package models

import "time"

type ProjectItem struct {
	ID        int64                 `json:"id" gorm:"primaryKey;autoIncrement"`
	ProjectID int64                 `json:"project_id" gorm:"index"`
	Name      string                `json:"name"`
	Qty       float64               `json:"qty"`
	Unit      string                `json:"unit"`
	Price     float64               `json:"price"`
	DpaPrice  float64               `json:"dpa_price"`
	Vendor    string                `json:"vendor"`
	Surveys   []ProjectItemSurvey   `json:"surveys" gorm:"foreignKey:ProjectItemID;constraint:OnDelete:CASCADE;"`
}

type ProjectItemSurvey struct {
	ID            int64   `json:"id" gorm:"primaryKey;autoIncrement"`
	ProjectItemID int64   `json:"project_item_id" gorm:"index"`
	VendorName    string  `json:"vendor_name"`
	Price         float64 `json:"price"`
	Url           string  `json:"url"`
	IsSelected    bool    `json:"is_selected"`
	ScreenshotUrl string  `json:"screenshot_url"`
}

type Project struct {
	ID              int64     `json:"id" gorm:"primaryKey;autoIncrement"`
	Name            string    `json:"name"`
	Description     string    `json:"description"`
	Budget          float64   `json:"budget"`
	Ministry        string    `json:"ministry"`
	Province        string    `json:"province"`
	IdSatker        string    `json:"idSatker" gorm:"index"`
	SourceURL       string    `json:"source_url"`
	Status          string    `json:"status"`
	StartDate       *time.Time `json:"start_date,omitempty"`
	EndDate         *time.Time `json:"end_date,omitempty"`
	CreatedAt       time.Time `json:"created_at"`
	UpdatedAt       time.Time `json:"updated_at"`
	Items           []ProjectItem `json:"items,omitempty" gorm:"foreignKey:ProjectID;constraint:OnDelete:CASCADE;"`
}


type ProjectFilter struct {
	Ministry  string `json:"ministry,omitempty"`
	Province  string `json:"province,omitempty"`
	IdSatker  string `json:"idSatker,omitempty"`
	Status    string `json:"status,omitempty"`
	MinBudget float64 `json:"min_budget,omitempty"`
	MaxBudget float64 `json:"max_budget,omitempty"`
	Limit     int    `json:"limit,omitempty"`
	Offset    int    `json:"offset,omitempty"`
}

type ProjectCreate struct {
	Name        string  `json:"name"`
	Description string  `json:"description"`
	Budget      float64 `json:"budget"`
	Ministry    string  `json:"ministry"`
	Province    string  `json:"province"`
	IdSatker    string  `json:"idSatker"`
	SourceURL   string  `json:"source_url"`
	Status      string  `json:"status"`
	StartDate   *time.Time `json:"start_date,omitempty"`
	EndDate     *time.Time `json:"end_date,omitempty"`
}

type ProjectUpdate struct {
	Name        *string     `json:"name,omitempty"`
	Description *string     `json:"description,omitempty"`
	Budget      *float64    `json:"budget,omitempty"`
	Ministry    *string     `json:"ministry,omitempty"`
	Province    *string     `json:"province,omitempty"`
	IdSatker    *string     `json:"idSatker,omitempty"`
	Status      *string     `json:"status,omitempty"`
	StartDate   *time.Time  `json:"start_date,omitempty"`
	EndDate     *time.Time  `json:"end_date,omitempty"`
}