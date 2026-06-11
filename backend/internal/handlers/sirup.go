package handlers

import (
	"encoding/json"
	"fmt"
	"io"
	"log"
	"net/http"
	"strconv"
	"time"

	"gorm.io/gorm"
)

// SirupPackage represents a parsed package from LKPP SIRUP
type SirupPackage struct {
	NoSirup         string `json:"noSirup"`
	PackName        string `json:"packName"`
	Pagu            int    `json:"pagu"`
	Method          string `json:"method"`
	SumberDana      string `json:"sumberDana"`
	Tahun           string `json:"tahun"`
	JadwalPemilihan string `json:"jadwalPemilihan"`
}

type SirupHandler struct {
	DB *gorm.DB
}

func NewSirupHandler(db *gorm.DB) *SirupHandler {
	return &SirupHandler{DB: db}
}

// GetSirupPackages fetches live RUP data directly from the official LKPP API, with fallback to local database
func (h *SirupHandler) GetSirupPackages(w http.ResponseWriter, r *http.Request) {
	satkerID := r.PathValue("id")
	if satkerID == "" {
		http.Error(w, "ID Satker wajib diisi", http.StatusBadRequest)
		return
	}

	tahun := r.URL.Query().Get("tahun")
	if tahun == "" {
		tahun = strconv.Itoa(time.Now().Year())
	}

	// Fetch up to 2000 records via survey-service (Puppeteer) to bypass IP block
	lkppURL := fmt.Sprintf(
		"http://127.0.0.1:3001/api/survey/sirup/%s?tahun=%s",
		satkerID,
		tahun,
	)

	req, err := http.NewRequest(http.MethodGet, lkppURL, nil)
	if err != nil {
		http.Error(w, "Gagal membuat request ke LKPP proxy: "+err.Error(), http.StatusInternalServerError)
		return
	}

	var packages []SirupPackage
	var useFallback bool

	client := &http.Client{Timeout: 60 * time.Second}
	resp, err := client.Do(req)
	if err != nil || resp.StatusCode != http.StatusOK {
		if err != nil {
			log.Printf("LKPP Proxy Error: %v", err)
		} else {
			log.Printf("LKPP Proxy StatusCode: %d", resp.StatusCode)
		}
		useFallback = true
	} else {
		defer resp.Body.Close()
		bodyBytes, err := io.ReadAll(resp.Body)
		if err != nil {
			useFallback = true
		} else {
			var lkppResponse struct {
				AaData [][]string `json:"aaData"`
			}
			if err := json.Unmarshal(bodyBytes, &lkppResponse); err != nil {
				useFallback = true
			} else {
				// Parse raw array to structured JSON
				for _, raw := range lkppResponse.AaData {
					if len(raw) < 5 {
						continue
					}

					var paguVal int
					fmt.Sscanf(raw[2], "%d", &paguVal)

					method := raw[3]
					if method == "" || method == "null" {
						method = "Pengadaan Langsung"
					}

					packages = append(packages, SirupPackage{
						NoSirup:         raw[0],
						PackName:        raw[1],
						Pagu:            paguVal,
						Method:          method,
						SumberDana:      raw[4],
						Tahun:           tahun,
						JadwalPemilihan: raw[6],
					})
				}
			}
		}
	}

	if useFallback {
		// Fetch from local database table procurement_packs
		var dbPackages []struct {
			NoSirup           string `gorm:"column:no_sirup"`
			PackName          string `gorm:"column:pack_name"`
			BudgetAllocation  int    `gorm:"column:budget_allocation"`
			ProcurementMethod string `gorm:"column:procurement_method"`
			BudgetSource      string `gorm:"column:budget_source"`
			Year              int    `gorm:"column:year"`
		}
		
		err := h.DB.Raw("SELECT no_sirup, pack_name, budget_allocation, procurement_method, budget_source, year FROM procurement_packs WHERE satker_id = ? AND year = ?", satkerID, tahun).Scan(&dbPackages).Error
		if err == nil && len(dbPackages) > 0 {
			for _, dp := range dbPackages {
				packages = append(packages, SirupPackage{
					NoSirup:         dp.NoSirup,
					PackName:        dp.PackName,
					Pagu:            dp.BudgetAllocation,
					Method:          dp.ProcurementMethod,
					SumberDana:      dp.BudgetSource,
					Tahun:           strconv.Itoa(dp.Year),
					JadwalPemilihan: "",
				})
			}
		} else {
			// If fallback also fails, return original connection error
			http.Error(w, fmt.Sprintf("Gagal menghubungi server SIRUP LKPP. Err: %v", err), http.StatusBadGateway)
			return
		}
	}

	w.Header().Set("Content-Type", "application/json")
	w.Header().Set("Access-Control-Allow-Origin", "*")
	json.NewEncoder(w).Encode(map[string]interface{}{
		"success":  true,
		"satkerId": satkerID,
		"tahun":    tahun,
		"total":    len(packages),
		"packages": packages,
	})
}

// ImportSirupPackages allows frontend to upload and save RUP packages to the local database
func (h *SirupHandler) ImportSirupPackages(w http.ResponseWriter, r *http.Request) {
	satkerID := r.PathValue("id")
	if satkerID == "" {
		http.Error(w, "ID Satker wajib diisi", http.StatusBadRequest)
		return
	}

	var body struct {
		AaData [][]string `json:"aaData"`
	}
	if err := json.NewDecoder(r.Body).Decode(&body); err != nil {
		http.Error(w, "Format JSON tidak valid: "+err.Error(), http.StatusBadRequest)
		return
	}

	tahun := r.URL.Query().Get("tahun")
	if tahun == "" {
		tahun = strconv.Itoa(time.Now().Year())
	}
	tahunInt, _ := strconv.Atoi(tahun)
	if tahunInt == 0 {
		tahunInt = time.Now().Year()
	}

	tx := h.DB.Begin()
	// Clear old entries for this satker & year
	if err := tx.Exec("DELETE FROM procurement_packs WHERE satker_id = ? AND year = ?", satkerID, tahunInt).Error; err != nil {
		tx.Rollback()
		http.Error(w, "Gagal membersihkan data lama: "+err.Error(), http.StatusInternalServerError)
		return
	}

	for _, raw := range body.AaData {
		if len(raw) < 5 {
			continue
		}

		var paguVal int64
		fmt.Sscanf(raw[2], "%d", &paguVal)

		method := raw[3]
		if method == "" || method == "null" {
			method = "Pengadaan Langsung"
		}

		err := tx.Exec(
			`INSERT INTO procurement_packs (no_sirup, pack_name, budget_allocation, procurement_method, budget_source, year, satker_id, pack_status, created_at, updated_at)
			 VALUES (?, ?, ?, ?, ?, ?, ?, 'Live', NOW(), NOW())
			 ON CONFLICT (no_sirup) DO UPDATE SET
				pack_name = EXCLUDED.pack_name,
				budget_allocation = EXCLUDED.budget_allocation,
				procurement_method = EXCLUDED.procurement_method,
				budget_source = EXCLUDED.budget_source,
				pack_status = 'Live',
				updated_at = NOW()`,
			raw[0], raw[1], paguVal, method, raw[4], tahunInt, satkerID,
		).Error

		if err != nil {
			tx.Rollback()
			http.Error(w, "Gagal mengimpor paket "+raw[0]+": "+err.Error(), http.StatusInternalServerError)
			return
		}
	}

	if err := tx.Commit().Error; err != nil {
		http.Error(w, "Gagal menyimpan transaksi: "+err.Error(), http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	w.Header().Set("Access-Control-Allow-Origin", "*")
	json.NewEncoder(w).Encode(map[string]interface{}{
		"success": true,
		"message": fmt.Sprintf("Berhasil mengimpor %d paket", len(body.AaData)),
	})
}

// Options handles CORS preflight requests
func (h *SirupHandler) Options(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Access-Control-Allow-Origin", "*")
	w.Header().Set("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
	w.Header().Set("Access-Control-Allow-Headers", "Content-Type, X-User-Role, X-User-Satker")
	w.WriteHeader(http.StatusOK)
}

