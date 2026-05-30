package models

import "time"

type Project struct {
	ID              int64     `json:"id"`
	Name            string    `json:"name"`
	Description     string    `json:"description"`
	Budget          float64   `json:"budget"`
	Ministry        string    `json:"ministry"`
	Province        string    `json:"province"`
	SourceURL       string    `json:"source_url"`
	Status          string    `json:"status"`
	StartDate       *time.Time `json:"start_date,omitempty"`
	EndDate         *time.Time `json:"end_date,omitempty"`
	CreatedAt       time.Time `json:"created_at"`
	UpdatedAt       time.Time `json:"updated_at"`
}

type ProjectFilter struct {
	Ministry  string `json:"ministry,omitempty"`
	Province  string `json:"province,omitempty"`
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
	Status      *string     `json:"status,omitempty"`
	StartDate   *time.Time  `json:"start_date,omitempty"`
	EndDate     *time.Time  `json:"end_date,omitempty"`
}