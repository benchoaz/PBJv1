package handlers

import (
	"encoding/json"
	"net/http"
	"strings"

	"pbj/internal/models"
	"gorm.io/gorm"
)

type ReportHandler struct {
	DB *gorm.DB
}

func NewReportHandler(db *gorm.DB) *ReportHandler {
	return &ReportHandler{DB: db}
}

type AbsorptionReportItem struct {
	MAK            string  `json:"mak"`
	Program        string  `json:"program"`
	Kegiatan       string  `json:"kegiatan"`
	SubKegiatan    string  `json:"sub_kegiatan"`
	TotalPagu      float64 `json:"total_pagu"`
	TotalRealisasi float64 `json:"total_realisasi"`
	TotalEfisiensi float64 `json:"total_efisiensi"`
	PackageCount   int     `json:"package_count"`
	Percentage     float64 `json:"percentage"`
}

type AbsorptionSummary struct {
	TotalCompletedPackages int                    `json:"total_completed_packages"`
	TotalPagu              float64                `json:"total_pagu"`
	TotalRealisasi         float64                `json:"total_realisasi"`
	TotalEfisiensi         float64                `json:"total_efisiensi"`
	OverallPercentage      float64                `json:"overall_percentage"`
	Breakdown              []AbsorptionReportItem `json:"breakdown"`
}

// GET /api/reports/absorption
func (h *ReportHandler) GetAbsorptionReport(w http.ResponseWriter, r *http.Request) {
	userRole := r.Header.Get("X-User-Role")
	userSatker := r.Header.Get("X-User-Satker")

	// 1. Fetch finished projects
	var projects []models.Project
	query := h.DB.Where("status = ? OR status = ? OR status = ? OR status = ? OR status = ?", "Selesai", "Selesai (Arsip Lengkap)", "Selesai (Arsip Belum Lengkap)", "Selesai (Adendum)", "Verifikasi Adendum oleh PP")

	// Enforce Satker access constraints
	if userRole != "" && strings.ToLower(userRole) != "admin" {
		if userSatker == "" {
			writeJSON(w, http.StatusOK, AbsorptionSummary{Breakdown: []AbsorptionReportItem{}})
			return
		}
		satkers := strings.Split(userSatker, ",")
		query = query.Where("id_satker IN ?", satkers)
	}

	if err := query.Find(&projects).Error; err != nil {
		writeError(w, http.StatusInternalServerError, "Failed to retrieve projects: "+err.Error())
		return
	}

	// 2. Fetch BAHP documents for realization numbers
	var projectIDs []int64
	for _, p := range projects {
		projectIDs = append(projectIDs, p.ID)
	}

	var bahps []models.BahpDocument
	if len(projectIDs) > 0 {
		h.DB.Where("project_id IN ?", projectIDs).Find(&bahps)
	}

	bahpMap := make(map[int64]models.BahpDocument)
	for _, b := range bahps {
		bahpMap[b.ProjectID] = b
	}

	// 3. Process aggregation
	breakdownMap := make(map[string]*AbsorptionReportItem)
	var totalPagu, totalRealisasi float64
	completedCount := 0

	for _, p := range projects {
		completedCount++
		
		// Parse description JSON
		var descData struct {
			NamaAcara       string `json:"namaAcara"`
			PackageMetadata struct {
				Program     string `json:"program"`
				Kegiatan    string `json:"kegiatan"`
				SubKegiatan string `json:"sub_kegiatan"`
			} `json:"packageMetadata"`
			SelectedPack struct {
				Mak string `json:"mak"`
			} `json:"selectedPack"`
		}

		if p.Description != "" {
			_ = json.Unmarshal([]byte(p.Description), &descData)
		}

		// Fallback defaults if not set in DPA JSON
		mak := descData.SelectedPack.Mak
		if mak == "" {
			mak = "5.1.02.01.01.0024" // default generic belanja barang/jasa
		}
		program := descData.PackageMetadata.Program
		if program == "" {
			program = "Program Penunjang Urusan Pemerintahan Daerah"
		}
		kegiatan := descData.PackageMetadata.Kegiatan
		if kegiatan == "" {
			kegiatan = "Penyediaan Jasa Penunjang Urusan Pemerintahan Daerah"
		}
		subKegiatan := descData.PackageMetadata.SubKegiatan
		if subKegiatan == "" {
			subKegiatan = "Penyediaan Makanan dan Minuman"
		}

		// Calculate realization from BAHP (NegotiatedPrice + ShippingCost)
		var realisasi float64
		if b, ok := bahpMap[p.ID]; ok {
			var items []models.BahpItem
			if b.ItemsJSON != "" && json.Unmarshal([]byte(b.ItemsJSON), &items) == nil && len(items) > 0 {
				for _, item := range items {
					realisasi += (item.NegotiatedPrice * item.QtyConfirmed) + item.ShippingCost
				}
			} else {
				realisasi = float64(b.NegotiatedPrice + b.ShippingCost)
			}
		} else {
			// Fallback: if project is finished but BAHP document is not created (unlikely in prod, but possible in test data),
			// we can fallback to the HPS or Project budget, or keep it 0. Let's use 0 or item price.
			realisasi = 0
		}

		pagu := p.Budget
		efisiensi := pagu - realisasi

		totalPagu += pagu
		totalRealisasi += realisasi

		// Group by Kegiatan + MAK key
		key := kegiatan + "||" + mak
		if item, ok := breakdownMap[key]; ok {
			item.TotalPagu += pagu
			item.TotalRealisasi += realisasi
			item.TotalEfisiensi += efisiensi
			item.PackageCount++
		} else {
			breakdownMap[key] = &AbsorptionReportItem{
				MAK:            mak,
				Program:        program,
				Kegiatan:       kegiatan,
				SubKegiatan:    subKegiatan,
				TotalPagu:      pagu,
				TotalRealisasi: realisasi,
				TotalEfisiensi: efisiensi,
				PackageCount:   1,
			}
		}
	}

	// 4. Convert map to slice and calculate percentages
	var breakdown []AbsorptionReportItem
	for _, item := range breakdownMap {
		if item.TotalPagu > 0 {
			item.Percentage = (item.TotalRealisasi / item.TotalPagu) * 100
		} else {
			item.Percentage = 0
		}
		breakdown = append(breakdown, *item)
	}

	var overallPercentage float64
	if totalPagu > 0 {
		overallPercentage = (totalRealisasi / totalPagu) * 100
	}

	summary := AbsorptionSummary{
		TotalCompletedPackages: completedCount,
		TotalPagu:              totalPagu,
		TotalRealisasi:         totalRealisasi,
		TotalEfisiensi:         totalPagu - totalRealisasi,
		OverallPercentage:      overallPercentage,
		Breakdown:              breakdown,
	}

	writeJSON(w, http.StatusOK, summary)
}
