package handlers

import (
	"os"
	"bytes"
	"encoding/json"
	"fmt"
	"io"
	"log"
	"mime/multipart"
	"net/http"
	"strconv"
	"time"

	"pbj/internal/models"

	"gorm.io/gorm"
	"gorm.io/gorm/clause"
)

// BudgetHandler handles all routes for DPA saving, SIRUP saving, RKA, and realization
type BudgetHandler struct {
	DB *gorm.DB
}

func NewBudgetHandler(db *gorm.DB) *BudgetHandler {
	return &BudgetHandler{DB: db}
}

func (h *BudgetHandler) Options(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Access-Control-Allow-Origin", "*")
	w.Header().Set("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS")
	w.Header().Set("Access-Control-Allow-Headers", "Content-Type, Authorization, X-User-Role, X-User-Satker")
	w.WriteHeader(http.StatusOK)
}

func corsJSON(w http.ResponseWriter) {
	w.Header().Set("Content-Type", "application/json")
	w.Header().Set("Access-Control-Allow-Origin", "*")
}

// ─────────────────────────────────────────────────────────────────────────────
// DPA ACCOUNTS — Save & Get
// ─────────────────────────────────────────────────────────────────────────────

// SaveDpaAccounts saves parsed DPA results to the database permanently
// POST /api/dpa/accounts/save
func (h *BudgetHandler) SaveDpaAccounts(w http.ResponseWriter, r *http.Request) {
	var req models.SaveDpaAccountsRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "Format JSON tidak valid: "+err.Error(), http.StatusBadRequest)
		return
	}

	satkerID := req.SatkerID
	if satkerID == "" {
		satkerID = r.Header.Get("X-User-Satker")
	}
	if satkerID == "" {
		http.Error(w, "satker_id wajib diisi", http.StatusBadRequest)
		return
	}

	tahun := req.TahunAnggaran
	if tahun == 0 {
		tahun = time.Now().Year()
	}

	savedCount := 0
	for _, acc := range req.Accounts {
		isValid := true
		if acc.IsValid != nil {
			isValid = *acc.IsValid
		}

		dpaAcc := models.DpaAccountSaved{
			SatkerID:         satkerID,
			TahunAnggaran:    tahun,
			KodeRekening:     acc.KodeRekening,
			UraianRekening:   acc.UraianRekening,
			PaguDpa:          acc.PaguDpa,
			Confidence:       acc.Confidence,
			OcrEngine:        acc.OcrEngine,
			PaguMethod:       acc.PaguMethod,
			IsVerified:       acc.IsVerified,
			IsValid:          isValid,
			ValidationReason: acc.ValidationReason,
			RawTextBlock:     acc.RawTextBlock,
			FileName:         req.FileName,
		}

		// Upsert: insert or update if kode_rekening already exists
		result := h.DB.Clauses(clause.OnConflict{
			Columns:   []clause.Column{{Name: "satker_id"}, {Name: "tahun_anggaran"}, {Name: "kode_rekening"}},
			DoUpdates: clause.AssignmentColumns([]string{
				"uraian_rekening", "pagu_dpa", "confidence", "ocr_engine", "pagu_method",
				"is_verified", "is_valid", "validation_reason", "raw_text_block", "file_name", "updated_at",
			}),
		}).Create(&dpaAcc)

		if result.Error != nil {
			log.Printf("Error saving DPA account %s: %v", acc.KodeRekening, result.Error)
			continue
		}

		// Ensure dpaAcc.ID is populated after OnConflict upsert
		if dpaAcc.ID == 0 {
			h.DB.Where("satker_id = ? AND tahun_anggaran = ? AND kode_rekening = ?",
				satkerID, tahun, acc.KodeRekening).Select("id").First(&dpaAcc)
		}

		// Save items (delete old, insert new)
		if len(acc.Items) > 0 && dpaAcc.ID > 0 {
			h.DB.Where("dpa_account_id = ?", dpaAcc.ID).Delete(&models.DpaItemSaved{})
			for i, item := range acc.Items {
				h.DB.Create(&models.DpaItemSaved{
					DpaAccountID: dpaAcc.ID,
					NoUrut:       i + 1,
					NamaBarang:   item.NamaBarang,
					Volume:       item.Volume,
					Satuan:       item.Satuan,
					HargaSatuan:  item.HargaSatuan,
					HargaTotal:   item.HargaTotal,
				})
			}
		}

		// Auto-link to budget_accounts (RKA) by matching kode_rekening
		var budgetAcc models.BudgetAccount
		if err := h.DB.Where("satker_id = ? AND tahun_anggaran = ? AND kode_rekening = ?",
			satkerID, tahun, acc.KodeRekening).First(&budgetAcc).Error; err == nil {
			diff := dpaAcc.PaguDpa - budgetAcc.AnggaranTahun
			h.DB.Model(&dpaAcc).Updates(map[string]interface{}{
				"budget_account_id": budgetAcc.ID,
				"is_rak_linked":     true,
				"rak_pagu_diff":     diff,
			})
		}

		savedCount++
	}

	corsJSON(w)
	json.NewEncoder(w).Encode(map[string]interface{}{
		"success": true,
		"message": "DPA berhasil disimpan",
		"saved":   savedCount,
	})
}

// GetDpaAccounts returns saved DPA accounts for a satker + tahun
// GET /api/dpa/accounts?satker_id=xxx&tahun=2026
func (h *BudgetHandler) GetDpaAccounts(w http.ResponseWriter, r *http.Request) {
	satkerID := r.URL.Query().Get("satker_id")
	if satkerID == "" {
		satkerID = r.Header.Get("X-User-Satker")
	}
	tahunStr := r.URL.Query().Get("tahun")
	tahun, _ := strconv.Atoi(tahunStr)
	if tahun == 0 {
		tahun = time.Now().Year()
	}

	var accounts []models.DpaAccountSaved
	query := h.DB.Where("satker_id = ? AND tahun_anggaran = ?", satkerID, tahun).
		Preload("Items")
	if err := query.Find(&accounts).Error; err != nil {
		http.Error(w, "Gagal mengambil data DPA: "+err.Error(), http.StatusInternalServerError)
		return
	}

	corsJSON(w)
	json.NewEncoder(w).Encode(map[string]interface{}{
		"success":  true,
		"tahun":    tahun,
		"accounts": accounts,
		"total":    len(accounts),
	})
}

// ─────────────────────────────────────────────────────────────────────────────
// SIRUP PACKAGES — Save & Get
// ─────────────────────────────────────────────────────────────────────────────

// SaveSirupPackages saves SIRUP packages to the DB and auto-links to DPA
// POST /api/sirup/save
func (h *BudgetHandler) SaveSirupPackages(w http.ResponseWriter, r *http.Request) {
	var req models.SaveSirupPackageRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "Format JSON tidak valid: "+err.Error(), http.StatusBadRequest)
		return
	}

	satkerID := req.SatkerID
	if satkerID == "" {
		satkerID = r.Header.Get("X-User-Satker")
	}
	tahun := req.TahunAnggaran
	if tahun == 0 {
		tahun = time.Now().Year()
	}

	savedCount := 0
	for _, pkg := range req.Packages {
		sp := models.SirupPackageSaved{
			SatkerID:        satkerID,
			TahunAnggaran:   tahun,
			NoSirup:         pkg.NoSirup,
			NamaPaket:       pkg.NamaPaket,
			PaguSirup:       pkg.PaguSirup,
			SumberDana:      pkg.SumberDana,
			MetodePemilihan: pkg.MetodePemilihan,
			JenisPengadaan:  pkg.JenisPengadaan,
			Mak:             pkg.Mak,
			Klpd:            pkg.Klpd,
			SatkerNama:      pkg.SatkerNama,
			VolumePekerjaan: pkg.VolumePekerjaan,
			Lokasi:          pkg.Lokasi,
			Uraian:          pkg.Uraian,
			Spesifikasi:     pkg.Spesifikasi,
			StatusSirup:     pkg.StatusSirup,
			SourceURL:       pkg.SourceURL,
			ScrapedAt:       time.Now(),
		}

		result := h.DB.Clauses(clause.OnConflict{
			Columns:   []clause.Column{{Name: "no_sirup"}},
			DoUpdates: clause.AssignmentColumns([]string{
				"nama_paket", "pagu_sirup", "sumber_dana", "metode_pemilihan",
				"jenis_pengadaan", "mak", "uraian", "spesifikasi", "scraped_at", "updated_at",
			}),
		}).Create(&sp)

		if result.Error != nil {
			log.Printf("Error saving SIRUP package %s: %v", pkg.NoSirup, result.Error)
			continue
		}

		// Auto-link to DPA account by matching kode_rekening / MAK
		if pkg.Mak != "" {
			var dpaAcc models.DpaAccountSaved
			if err := h.DB.Where("satker_id = ? AND tahun_anggaran = ? AND kode_rekening = ?",
				satkerID, tahun, pkg.Mak).First(&dpaAcc).Error; err == nil {
				diff := sp.PaguSirup - dpaAcc.PaguDpa
				h.DB.Model(&sp).Updates(map[string]interface{}{
					"dpa_account_id": dpaAcc.ID,
					"is_dpa_linked":  true,
					"pagu_diff":      diff,
				})
			}
		}

		savedCount++
	}

	corsJSON(w)
	json.NewEncoder(w).Encode(map[string]interface{}{
		"success": true,
		"message": "Paket SIRUP berhasil disimpan",
		"saved":   savedCount,
	})
}

// GetSirupPackagesSaved returns saved SIRUP packages for satker + tahun
// GET /api/sirup/saved?satker_id=xxx&tahun=2026
func (h *BudgetHandler) GetSirupPackagesSaved(w http.ResponseWriter, r *http.Request) {
	satkerID := r.URL.Query().Get("satker_id")
	if satkerID == "" {
		satkerID = r.Header.Get("X-User-Satker")
	}
	tahunStr := r.URL.Query().Get("tahun")
	tahun, _ := strconv.Atoi(tahunStr)
	if tahun == 0 {
		tahun = time.Now().Year()
	}

	var packages []models.SirupPackageSaved
	if err := h.DB.Where("satker_id = ? AND tahun_anggaran = ?", satkerID, tahun).
		Find(&packages).Error; err != nil {
		http.Error(w, "Gagal mengambil data SIRUP: "+err.Error(), http.StatusInternalServerError)
		return
	}

	corsJSON(w)
	json.NewEncoder(w).Encode(map[string]interface{}{
		"success":  true,
		"tahun":    tahun,
		"packages": packages,
		"total":    len(packages),
	})
}

// ─────────────────────────────────────────────────────────────────────────────
// RKA / BUDGET ACCOUNTS — Save & Get
// ─────────────────────────────────────────────────────────────────────────────

// SaveRakAccounts saves RKA monthly budget data
// POST /api/rak/accounts
func (h *BudgetHandler) SaveRakAccounts(w http.ResponseWriter, r *http.Request) {
	var body struct {
		SatkerID      string                `json:"satker_id"`
		TahunAnggaran int                   `json:"tahun_anggaran"`
		NamaSkpd      string                `json:"nama_skpd"`
		NilaiAnggaran float64               `json:"nilai_anggaran"`
		FileName      string                `json:"file_name"`
		Accounts      []models.BudgetAccount `json:"accounts"`
	}
	bodyBytes, _ := io.ReadAll(r.Body)
	log.Printf("[SaveRakAccounts] Received body length: %d", len(bodyBytes))
	r.Body = io.NopCloser(bytes.NewBuffer(bodyBytes))

	if err := json.NewDecoder(r.Body).Decode(&body); err != nil {
		log.Printf("[SaveRakAccounts] Decode error: %v", err)
		http.Error(w, "Format JSON tidak valid: "+err.Error(), http.StatusBadRequest)
		return
	}

	log.Printf("[SaveRakAccounts] Unmarshaled accounts: %+v", body.Accounts)

	satkerID := body.SatkerID
	if satkerID == "" {
		satkerID = r.Header.Get("X-User-Satker")
	}
	tahun := body.TahunAnggaran
	if tahun == 0 {
		tahun = time.Now().Year()
	}

	debugLog := fmt.Sprintf("[%s] [SaveRakAccounts] Payload received for Satker %s, Tahun %d, Total Accounts: %d\n", time.Now().Format(time.RFC3339), satkerID, tahun, len(body.Accounts))
	f, _ := os.OpenFile("./api_debug.log", os.O_APPEND|os.O_CREATE|os.O_WRONLY, 0644)
	if f != nil {
		f.WriteString(debugLog)
		f.Close()
	}
	fmt.Print(debugLog)

	// Find active RKA document, or create one if it doesn't exist
	var rkaDoc models.RakDocument
	err := h.DB.Where("satker_id = ? AND tahun_anggaran = ? AND is_active = ?", satkerID, tahun, true).First(&rkaDoc).Error
	if err != nil {
		rkaDoc = models.RakDocument{
			SatkerID:      satkerID,
			TahunAnggaran: tahun,
			NamaSkpd:      body.NamaSkpd,
			NilaiAnggaran: body.NilaiAnggaran, // This can be accumulated later
			FileName:      "Master Data RAK Terintegrasi",
			IsActive:      true,
			UploadedAt:    time.Now(),
		}
		if err := h.DB.Create(&rkaDoc).Error; err != nil {
			http.Error(w, "Gagal menyimpan dokumen RKA: "+err.Error(), http.StatusInternalServerError)
			return
		}
	}

	// Save accounts
	for _, acc := range body.Accounts {
		acc.RakDocumentID = rkaDoc.ID
		acc.SatkerID = satkerID
		acc.TahunAnggaran = tahun
		var existing models.BudgetAccount
		findErr := h.DB.Where("satker_id = ? AND tahun_anggaran = ? AND kode_rekening = ? AND sub_kegiatan = ?", 
			satkerID, tahun, acc.KodeRekening, acc.SubKegiatan).First(&existing).Error
		
		var err error
		if findErr == nil {
			acc.ID = existing.ID
			acc.CreatedAt = existing.CreatedAt
			err = h.DB.Save(&acc).Error
		} else {
			acc.ID = 0 // Reset ID to let DB generate a new auto-incremented primary key
			err = h.DB.Create(&acc).Error
		}
		if err != nil {
			errLog := fmt.Sprintf("[%s] Error saving account (Kode: %s, SubKeg: %s, ID: %d): %v\n", 
				time.Now().Format(time.RFC3339), acc.KodeRekening, acc.SubKegiatan, acc.ID, err)
			f, _ := os.OpenFile("./api_debug.log", os.O_APPEND|os.O_CREATE|os.O_WRONLY, 0644)
			if f != nil {
				f.WriteString(errLog)
				f.Close()
			}
			fmt.Print(errLog)
			http.Error(w, "Gagal menyimpan akun RKA: "+err.Error(), http.StatusInternalServerError)
			return
		}
	}

	// After saving RKA, re-run auto-link for DPA accounts
	h.DB.Exec(`
		UPDATE dpa_account_saveds da
		SET budget_account_id = ba.id,
		    is_rak_linked      = TRUE,
		    rak_pagu_diff      = (da.pagu_dpa - ba.anggaran_tahun)
		FROM budget_accounts ba
		WHERE ba.satker_id      = da.satker_id
		  AND ba.tahun_anggaran = da.tahun_anggaran
		  AND ba.kode_rekening  = da.kode_rekening
		  AND da.satker_id      = ?
		  AND da.tahun_anggaran = ?
	`, satkerID, tahun)

	corsJSON(w)
	json.NewEncoder(w).Encode(map[string]interface{}{
		"success":    true,
		"rka_doc_id": rkaDoc.ID,
		"message":    "RKA Anggaran Kas berhasil disimpan",
	})
}

// GetRakAccounts returns the active RKA budget accounts for a satker + tahun
// GET /api/rak/accounts?satker_id=xxx&tahun=2026
func (h *BudgetHandler) GetRakAccounts(w http.ResponseWriter, r *http.Request) {
	satkerID := r.URL.Query().Get("satker_id")
	if satkerID == "" {
		satkerID = r.Header.Get("X-User-Satker")
	}
	tahunStr := r.URL.Query().Get("tahun")
	tahun, _ := strconv.Atoi(tahunStr)
	if tahun == 0 {
		tahun = time.Now().Year()
	}

	// Get the latest RKA document (for metadata like filename)
	var rkaDoc models.RakDocument
	h.DB.Where("satker_id = ? AND tahun_anggaran = ?", satkerID, tahun).
		Order("uploaded_at DESC").First(&rkaDoc)

	var accounts []models.BudgetAccount
	if err := h.DB.Where("satker_id = ? AND tahun_anggaran = ?", satkerID, tahun).
		Preload("Realization").Find(&accounts).Error; err != nil || len(accounts) == 0 {
		// No active RKA — return empty
		corsJSON(w)
		json.NewEncoder(w).Encode(map[string]interface{}{
			"success":  true,
			"tahun":    tahun,
			"has_rka":  false,
			"accounts": []interface{}{},
		})
		return
	}

	// Ambil semua komitmen aktif untuk satker + tahun ini
	var commitments []models.BudgetCommitment
	h.DB.Where("satker_id = ? AND tahun_anggaran = ?", satkerID, tahun).Find(&commitments)

	// Map commitments by BudgetAccountID
	commitmentsMap := make(map[uint64]float64)
	for _, c := range commitments {
		commitmentsMap[c.BudgetAccountID] += c.NilaiKomitmen
	}

	// Bentuk response custom yang menyertakan total komitmen dan total realisasi
	type AccountResponse struct {
		models.BudgetAccount
		TotalKomitmen  float64 `json:"total_komitmen"`
		TotalRealisasi float64 `json:"total_realisasi"`
	}

	resAccounts := make([]AccountResponse, len(accounts))
	for i, acc := range accounts {
		// Hitung total realisasi dari realisasi bulanan
		var totalReal float64
		for _, r := range acc.Realization {
			totalReal += r.NilaiRealisasi
		}

		resAccounts[i] = AccountResponse{
			BudgetAccount:  acc,
			TotalKomitmen:  commitmentsMap[acc.ID],
			TotalRealisasi: totalReal,
		}
	}

	corsJSON(w)
	json.NewEncoder(w).Encode(map[string]interface{}{
		"success":  true,
		"tahun":    tahun,
		"has_rka":  true,
		"rka_doc":  rkaDoc,
		"accounts": resAccounts,
		"total":    len(resAccounts),
	})
}

// ─────────────────────────────────────────────────────────────────────────────
// REKENING DASHBOARD — Integrated view per kode_rekening
// ─────────────────────────────────────────────────────────────────────────────

// GetRekeningSummary returns an integrated view of RKA + DPA + SIRUP for one rekening
// GET /api/rekening/{kode}?satker_id=xxx&tahun=2026
func (h *BudgetHandler) GetRekeningSummary(w http.ResponseWriter, r *http.Request) {
	kode := r.PathValue("kode")
	satkerID := r.URL.Query().Get("satker_id")
	if satkerID == "" {
		satkerID = r.Header.Get("X-User-Satker")
	}
	tahunStr := r.URL.Query().Get("tahun")
	tahun, _ := strconv.Atoi(tahunStr)
	if tahun == 0 {
		tahun = time.Now().Year()
	}

	result := map[string]interface{}{
		"kode_rekening": kode,
		"satker_id":     satkerID,
		"tahun":         tahun,
	}

	// RKA
	var budgetAcc models.BudgetAccount
	if err := h.DB.Where("satker_id = ? AND tahun_anggaran = ? AND kode_rekening = ?",
		satkerID, tahun, kode).
		Preload("Realization").First(&budgetAcc).Error; err == nil {
		result["rka"] = budgetAcc
	}

	// DPA
	var dpaAcc models.DpaAccountSaved
	if err := h.DB.Where("satker_id = ? AND tahun_anggaran = ? AND kode_rekening = ?",
		satkerID, tahun, kode).
		Preload("Items").First(&dpaAcc).Error; err == nil {
		result["dpa"] = dpaAcc
	}

	// SIRUP packages linked to this rekening
	var sirupPkgs []models.SirupPackageSaved
	h.DB.Where("satker_id = ? AND tahun_anggaran = ? AND mak = ?", satkerID, tahun, kode).
		Find(&sirupPkgs)
	result["sirup"] = sirupPkgs

	// Link status
	_, hasRka := result["rka"]
	_, hasDpa := result["dpa"]
	status := "incomplete"
	if hasRka && hasDpa && len(sirupPkgs) > 0 {
		status = "complete"
	} else if hasRka || hasDpa {
		status = "partial"
	}
	result["link_status"] = status

	corsJSON(w)
	json.NewEncoder(w).Encode(result)
}

// ─────────────────────────────────────────────────────────────────────────────
// REALIZATION — Monthly actual spending
// ─────────────────────────────────────────────────────────────────────────────

// SaveRealization saves or updates monthly realization
// POST /api/rak/realization
func (h *BudgetHandler) SaveRealization(w http.ResponseWriter, r *http.Request) {
	var body models.BudgetRealization
	if err := json.NewDecoder(r.Body).Decode(&body); err != nil {
		http.Error(w, "Format JSON tidak valid: "+err.Error(), http.StatusBadRequest)
		return
	}

	result := h.DB.Clauses(clause.OnConflict{
		Columns:   []clause.Column{{Name: "budget_account_id"}, {Name: "tahun_anggaran"}, {Name: "bulan"}},
		DoUpdates: clause.AssignmentColumns([]string{"nilai_realisasi", "keterangan", "updated_at"}),
	}).Create(&body)

	if result.Error != nil {
		http.Error(w, "Gagal menyimpan realisasi: "+result.Error.Error(), http.StatusInternalServerError)
		return
	}

	corsJSON(w)
	json.NewEncoder(w).Encode(map[string]interface{}{"success": true, "data": body})
}

// ─────────────────────────────────────────────────────────────────────────────
// RKA AI PARSER
// ─────────────────────────────────────────────────────────────────────────────

func (h *BudgetHandler) ParseRakAi(w http.ResponseWriter, r *http.Request) {
	err := r.ParseMultipartForm(10 << 20) // 10MB limit
	if err != nil {
		http.Error(w, "Gagal membaca berkas", http.StatusBadRequest)
		return
	}

	file, header, err := r.FormFile("file")
	if err != nil {
		http.Error(w, "Berkas tidak ditemukan", http.StatusBadRequest)
		return
	}
	defer file.Close()

	fileBytes, err := io.ReadAll(file)
	if err != nil {
		http.Error(w, "Gagal membaca isi berkas", http.StatusInternalServerError)
		return
	}

	var buf bytes.Buffer
	writer := multipart.NewWriter(&buf)
	part, err := writer.CreateFormFile("file", header.Filename)
	if err != nil {
		http.Error(w, "Gagal membuat form", http.StatusInternalServerError)
		return
	}
	part.Write(fileBytes)
	writer.Close()

	parserURL := fmt.Sprintf("%s/parse-rak", getDpaParserURL())
	req, err := http.NewRequest(http.MethodPost, parserURL, &buf)
	if err != nil {
		http.Error(w, "Gagal membuat request", http.StatusInternalServerError)
		return
	}
	req.Header.Set("Content-Type", writer.FormDataContentType())

	if provider := r.Header.Get("X-AI-Provider"); provider != "" {
		req.Header.Set("X-AI-Provider", provider)
	}
	if key := r.Header.Get("X-AI-Key"); key != "" {
		req.Header.Set("X-AI-Key", key)
	}
	if provider := r.Header.Get("X-AI-Escalation-Provider"); provider != "" {
		req.Header.Set("X-AI-Escalation-Provider", provider)
	}
	if key := r.Header.Get("X-AI-Escalation-Key"); key != "" {
		req.Header.Set("X-AI-Escalation-Key", key)
	}

	client := &http.Client{Timeout: 5 * time.Minute}
	resp, err := client.Do(req)
	if err != nil {
		http.Error(w, "Gagal memanggil Python dpa-parser: "+err.Error(), http.StatusInternalServerError)
		return
	}
	defer resp.Body.Close()

	respBody, _ := io.ReadAll(resp.Body)
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(resp.StatusCode)
	w.Write(respBody)
}

func (h *BudgetHandler) GetRakParseStatus(w http.ResponseWriter, r *http.Request) {
	jobID := r.URL.Query().Get("job_id")
	if jobID == "" {
		http.Error(w, "job_id diperlukan", http.StatusBadRequest)
		return
	}

	parserURL := fmt.Sprintf("%s/parse-rak/status/%s", getDpaParserURL(), jobID)
	req, err := http.NewRequest(http.MethodGet, parserURL, nil)
	if err != nil {
		http.Error(w, "Gagal membuat request", http.StatusInternalServerError)
		return
	}

	client := &http.Client{Timeout: 30 * time.Second}
	resp, err := client.Do(req)
	if err != nil {
		http.Error(w, "Gagal memanggil Python dpa-parser: "+err.Error(), http.StatusInternalServerError)
		return
	}
	defer resp.Body.Close()

	respBody, _ := io.ReadAll(resp.Body)
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(resp.StatusCode)
	w.Write(respBody)
}

