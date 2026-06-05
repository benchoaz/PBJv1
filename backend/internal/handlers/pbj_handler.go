package handlers

import (
	"encoding/json"
	"net/http"
	"pbj/internal/models"
	"strings"

	"gorm.io/gorm"
)

type PBJHandler struct {
	DB *gorm.DB
}

func NewPBJHandler(db *gorm.DB) *PBJHandler {
	return &PBJHandler{DB: db}
}

func (h *PBJHandler) hasAccessToSatker(userRole, userSatker, targetSatker string) bool {
	if userRole == "" {
		return false
	}
	if strings.ToLower(userRole) == "admin" {
		return true
	}
	if userSatker == "" {
		return false
	}
	satkers := strings.Split(userSatker, ",")
	for _, s := range satkers {
		if strings.TrimSpace(s) == strings.TrimSpace(targetSatker) {
			return true
		}
	}
	return false
}

// Enable CORS
func (h *PBJHandler) Options(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Access-Control-Allow-Origin", "*")
	w.Header().Set("Access-Control-Allow-Methods", "GET, POST, PUT, OPTIONS")
	w.Header().Set("Access-Control-Allow-Headers", "Content-Type, Authorization")
	w.WriteHeader(http.StatusNoContent)
}

func enableCors(w *http.ResponseWriter) {
	(*w).Header().Set("Access-Control-Allow-Origin", "*")
	(*w).Header().Set("Content-Type", "application/json")
}

// POST /api/pbj/packages
// Payload: Package with nested Items
func (h *PBJHandler) CreateOrUpdatePackage(w http.ResponseWriter, r *http.Request) {
	enableCors(&w)
	if r.Method != http.MethodPost {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	var pkg models.Package
	if err := json.NewDecoder(r.Body).Decode(&pkg); err != nil {
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}

	userRole := r.Header.Get("X-User-Role")
	userSatker := r.Header.Get("X-User-Satker")
	if userRole != "" && strings.ToLower(userRole) != "admin" {
		if !h.hasAccessToSatker(userRole, userSatker, pkg.SatkerID) {
			http.Error(w, "Forbidden: Anda tidak memiliki akses ke satker ini", http.StatusForbidden)
			return
		}
	}

	// Cek apakah paket dengan sirup_id sudah ada
	var existing models.Package
	result := h.DB.Preload("Items").Preload("Items.Surveys").Where("si_rupid = ?", pkg.SiRUPID).First(&existing)

	if result.Error == nil {
		// Update existing (hanya update items yang dikirim tanpa menghapus survey yang sudah ada)
		existing.NamaPaket = pkg.NamaPaket
		existing.PaguTotal = pkg.PaguTotal
		existing.Mak = pkg.Mak
		h.DB.Save(&existing)
		
		// Update items
		for _, newItem := range pkg.Items {
			var extItem models.PackageItem
			err := h.DB.Where("package_id = ? AND nama_barang = ?", existing.ID, newItem.NamaBarang).First(&extItem).Error
			if err != nil {
				// Create new item
				newItem.PackageID = existing.ID
				h.DB.Create(&newItem)
			} else {
				// Update existing item pagu/qty
				extItem.Qty = newItem.Qty
				extItem.HargaPaguSatuan = newItem.HargaPaguSatuan
				extItem.Satuan = newItem.Satuan
				h.DB.Save(&extItem)
			}
		}
		
		// Load ulang full object
		h.DB.Preload("Items").Preload("Items.Surveys").First(&existing, existing.ID)
		json.NewEncoder(w).Encode(existing)
		return
	}

	// Create new
	if err := h.DB.Create(&pkg).Error; err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	json.NewEncoder(w).Encode(pkg)
}

// PUT /api/pbj/packages/{id}/survey
func (h *PBJHandler) UpdateSurvey(w http.ResponseWriter, r *http.Request) {
	enableCors(&w)
	if r.Method != http.MethodPut {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	pathParts := strings.Split(r.URL.Path, "/")
	packageID := pathParts[4]

	// Enforce Satker Check
	var pkg models.Package
	if err := h.DB.First(&pkg, packageID).Error; err != nil {
		http.Error(w, "Package not found", http.StatusNotFound)
		return
	}
	userRole := r.Header.Get("X-User-Role")
	userSatker := r.Header.Get("X-User-Satker")
	if userRole != "" && strings.ToLower(userRole) != "admin" {
		if !h.hasAccessToSatker(userRole, userSatker, pkg.SatkerID) {
			http.Error(w, "Forbidden: Anda tidak memiliki akses ke paket satker lain", http.StatusForbidden)
			return
		}
	}

	// Request payload is an array of surveys
	var payload struct {
		Items []struct {
			NamaBarang  string              `json:"nama_barang"`
			SurveyResult models.SurveyResult `json:"survey_result"`
		} `json:"items"`
	}

	if err := json.NewDecoder(r.Body).Decode(&payload); err != nil {
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}

	for _, itemPayload := range payload.Items {
		var item models.PackageItem
		err := h.DB.Where("package_id = ? AND nama_barang = ?", packageID, itemPayload.NamaBarang).First(&item).Error
		if err == nil {
			survey := itemPayload.SurveyResult
			survey.PackageItemID = item.ID
			
			var existingSurvey models.SurveyResult
			errSurv := h.DB.Where("package_item_id = ?", item.ID).First(&existingSurvey).Error
			if errSurv == nil {
				existingSurvey.Vendor = survey.Vendor
				existingSurvey.HargaEkatalog = survey.HargaEkatalog
				existingSurvey.UrlProduk = survey.UrlProduk
				existingSurvey.ScreenshotPath = survey.ScreenshotPath
				existingSurvey.HargaHpsFinal = survey.HargaHpsFinal
				existingSurvey.StatusSurvey = survey.StatusSurvey
				h.DB.Save(&existingSurvey)
			} else {
				h.DB.Create(&survey)
			}
		}
	}

	// Return updated package
	h.DB.Preload("Items").Preload("Items.Surveys").First(&pkg, packageID)
	json.NewEncoder(w).Encode(pkg)
}

// GET /api/pbj/packages/{id}
func (h *PBJHandler) GetPackage(w http.ResponseWriter, r *http.Request) {
	enableCors(&w)
	pathParts := strings.Split(r.URL.Path, "/")
	if len(pathParts) < 5 {
		http.Error(w, "Invalid path", http.StatusBadRequest)
		return
	}
	
	sirupID := pathParts[4] // We fetch by SiRUP ID since frontend knows it
	
	var pkg models.Package
	result := h.DB.Preload("Items").Preload("Items.Surveys").Where("si_rupid = ?", sirupID).First(&pkg)
	if result.Error != nil {
		http.Error(w, "Package not found", http.StatusNotFound)
		return
	}

	userRole := r.Header.Get("X-User-Role")
	userSatker := r.Header.Get("X-User-Satker")
	if userRole != "" && strings.ToLower(userRole) != "admin" {
		if !h.hasAccessToSatker(userRole, userSatker, pkg.SatkerID) {
			http.Error(w, "Forbidden: Anda tidak memiliki akses ke paket satker lain", http.StatusForbidden)
			return
		}
	}

	json.NewEncoder(w).Encode(pkg)
}
