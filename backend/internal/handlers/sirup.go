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

// GetSirupPackageByID fetches a single package by its RUP ID from DB or LKPP detail page
func (h *SirupHandler) GetSirupPackageByID(w http.ResponseWriter, r *http.Request) {
	paketID := r.PathValue("id")
	if paketID == "" {
		http.Error(w, "ID RUP wajib diisi", http.StatusBadRequest)
		return
	}

	// 1. Coba cari di database lokal terlebih dahulu
	var dbPackage struct {
		NoSirup           string `gorm:"column:no_sirup"`
		PackName          string `gorm:"column:pack_name"`
		BudgetAllocation  int    `gorm:"column:budget_allocation"`
		ProcurementMethod string `gorm:"column:procurement_method"`
		BudgetSource      string `gorm:"column:budget_source"`
		Year              int    `gorm:"column:year"`
	}

	err := h.DB.Raw("SELECT no_sirup, pack_name, budget_allocation, procurement_method, budget_source, year FROM procurement_packs WHERE no_sirup = ?", paketID).Scan(&dbPackage).Error
	log.Printf("[GetSirupPackageByID] Cache check for %s: err=%v, no_sirup=%s", paketID, err, dbPackage.NoSirup)
	if err == nil && dbPackage.NoSirup != "" {
		// Ensure it also exists in sirup_package_saveds table
		var exists int64
		h.DB.Table("sirup_package_saveds").Where("no_sirup = ? AND tahun_anggaran = ?", dbPackage.NoSirup, dbPackage.Year).Count(&exists)
		log.Printf("[GetSirupPackageByID] Checking if %s exists in sirup_package_saveds: exists=%d", dbPackage.NoSirup, exists)
		if exists == 0 {
			sourceURL := fmt.Sprintf("https://sirup.inaproc.id/sirup/home/detailPaketPenyediaPublic2017?idPaket=%s", dbPackage.NoSirup)
			satkerID := r.Header.Get("X-User-Satker")
			if satkerID == "" {
				satkerID = "67081" // Default Kecamatan Besuk
			}
			log.Printf("[GetSirupPackageByID] Syncing cached package %s to sirup_package_saveds for satker=%s", dbPackage.NoSirup, satkerID)
			dbResult := h.DB.Exec(
				`INSERT INTO sirup_package_saveds (satker_id, tahun_anggaran, no_sirup, nama_paket, pagu_sirup, sumber_dana, metode_pemilihan, jenis_pengadaan, mak, klpd, satker_nama, volume_pekerjaan, lokasi, uraian, spesifikasi, status_sirup, raw_json, source_url, scraped_at, created_at, updated_at)
				 VALUES (?, ?, ?, ?, ?, ?, ?, '', '', '', '', '', '', '', '', 'Live', NULL, ?, NOW(), NOW(), NOW())
				 ON CONFLICT (no_sirup) DO NOTHING`,
				satkerID, dbPackage.Year, dbPackage.NoSirup, dbPackage.PackName, dbPackage.BudgetAllocation, dbPackage.BudgetSource, dbPackage.ProcurementMethod, sourceURL,
			)
			if dbResult.Error != nil {
				log.Printf("[GetSirupPackageByID] Error syncing cached package: %v", dbResult.Error)
			}
		}

		w.Header().Set("Content-Type", "application/json")
		w.Header().Set("Access-Control-Allow-Origin", "*")
		json.NewEncoder(w).Encode(map[string]interface{}{
			"success": true,
			"package": SirupPackage{
				NoSirup:         dbPackage.NoSirup,
				PackName:        dbPackage.PackName,
				Pagu:            dbPackage.BudgetAllocation,
				Method:          dbPackage.ProcurementMethod,
				SumberDana:      dbPackage.BudgetSource,
				Tahun:           strconv.Itoa(dbPackage.Year),
				JadwalPemilihan: "",
			},
		})
		return
	}

	// 2. Jika tidak ada di lokal, hubungi survey-service proxy
	lkppURL := fmt.Sprintf("http://127.0.0.1:3001/api/survey/sirup/package/%s", paketID)
	req, err := http.NewRequest(http.MethodGet, lkppURL, nil)
	if err != nil {
		http.Error(w, "Gagal membuat request ke LKPP proxy: "+err.Error(), http.StatusInternalServerError)
		return
	}

	client := &http.Client{Timeout: 60 * time.Second}
	resp, err := client.Do(req)
	if err != nil || resp.StatusCode != http.StatusOK {
		msg := "Gagal menghubungi LKPP proxy atau data RUP tidak ditemukan"
		if err != nil {
			msg += ": " + err.Error()
		}
		http.Error(w, msg, http.StatusBadGateway)
		return
	}
	defer resp.Body.Close()

	var scraped struct {
		NoSirup    string `json:"noSirup"`
		PackName   string `json:"packName"`
		Pagu       int    `json:"pagu"`
		Method     string `json:"method"`
		SumberDana string `json:"sumberDana"`
		Tahun      string `json:"tahun"`
		SatkerID   string `json:"satkerId"`
		Satker     string `json:"satker"`
	}

	if err := json.NewDecoder(resp.Body).Decode(&scraped); err != nil {
		http.Error(w, "Gagal mengurai response RUP detail: "+err.Error(), http.StatusBadGateway)
		return
	}

	tahunVal, _ := strconv.Atoi(scraped.Tahun)
	if tahunVal == 0 {
		tahunVal = time.Now().Year()
	}

	// Default satker id if empty
	satkerID := scraped.SatkerID
	if satkerID == "" {
		satkerID = r.Header.Get("X-User-Satker")
		if satkerID == "" {
			satkerID = "67081" // Kecamatan Besuk default
		}
	}

	// Save to database procurement_packs table
	h.DB.Exec(
		`INSERT INTO procurement_packs (no_sirup, pack_name, budget_allocation, procurement_method, budget_source, year, satker_id, pack_status, created_at, updated_at)
		 VALUES (?, ?, ?, ?, ?, ?, ?, 'Live', NOW(), NOW())
		 ON CONFLICT (no_sirup) DO UPDATE SET
			pack_name = EXCLUDED.pack_name,
			budget_allocation = EXCLUDED.budget_allocation,
			procurement_method = EXCLUDED.procurement_method,
			budget_source = EXCLUDED.budget_source,
			pack_status = 'Live',
			updated_at = NOW()`,
		scraped.NoSirup, scraped.PackName, scraped.Pagu, scraped.Method, scraped.SumberDana, tahunVal, satkerID,
	)

	// Save to database sirup_package_saveds table to make it visible on the page
	sourceURL := fmt.Sprintf("https://sirup.inaproc.id/sirup/home/detailPaketPenyediaPublic2017?idPaket=%s", scraped.NoSirup)
	h.DB.Exec(
		`INSERT INTO sirup_package_saveds (satker_id, tahun_anggaran, no_sirup, nama_paket, pagu_sirup, sumber_dana, metode_pemilihan, jenis_pengadaan, mak, klpd, satker_nama, volume_pekerjaan, lokasi, uraian, spesifikasi, status_sirup, raw_json, source_url, scraped_at, created_at, updated_at)
		 VALUES (?, ?, ?, ?, ?, ?, ?, '', '', '', ?, '', '', '', '', 'Live', NULL, ?, NOW(), NOW(), NOW())
		 ON CONFLICT (no_sirup) DO UPDATE SET
			nama_paket = EXCLUDED.nama_paket,
			pagu_sirup = EXCLUDED.pagu_sirup,
			sumber_dana = EXCLUDED.sumber_dana,
			metode_pemilihan = EXCLUDED.metode_pemilihan,
			satker_nama = EXCLUDED.satker_nama,
			status_sirup = 'Live',
			source_url = EXCLUDED.source_url,
			scraped_at = NOW(),
			updated_at = NOW()`,
		satkerID, tahunVal, scraped.NoSirup, scraped.PackName, scraped.Pagu, scraped.SumberDana, scraped.Method, scraped.Satker, sourceURL,
	)

	w.Header().Set("Content-Type", "application/json")
	w.Header().Set("Access-Control-Allow-Origin", "*")
	json.NewEncoder(w).Encode(map[string]interface{}{
		"success": true,
		"package": SirupPackage{
			NoSirup:         scraped.NoSirup,
			PackName:        scraped.PackName,
			Pagu:            scraped.Pagu,
			Method:          scraped.Method,
			SumberDana:      scraped.SumberDana,
			Tahun:           scraped.Tahun,
			JadwalPemilihan: "",
		},
	})
}

// Options handles CORS preflight requests
func (h *SirupHandler) Options(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Access-Control-Allow-Origin", "*")
	w.Header().Set("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
	w.Header().Set("Access-Control-Allow-Headers", "Content-Type, X-User-Role, X-User-Satker")
	w.WriteHeader(http.StatusOK)
}

