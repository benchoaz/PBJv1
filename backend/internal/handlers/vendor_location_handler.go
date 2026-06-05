package handlers

import (
	"encoding/json"
	"net/http"
	"pbj/internal/models"

	"gorm.io/gorm"
)

type VendorLocationHandler struct {
	db *gorm.DB
}

func NewVendorLocationHandler(db *gorm.DB) *VendorLocationHandler {
	return &VendorLocationHandler{db: db}
}

// Options handles CORS preflight
func (h *VendorLocationHandler) Options(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Access-Control-Allow-Origin", "*")
	w.Header().Set("Access-Control-Allow-Methods", "POST, GET, OPTIONS")
	w.Header().Set("Access-Control-Allow-Headers", "Content-Type, Authorization")
	w.WriteHeader(http.StatusOK)
}

// GetAll vendor location mappings
func (h *VendorLocationHandler) GetAll(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Access-Control-Allow-Origin", "*")
	var list []models.VendorLocation
	if err := h.db.Find(&list).Error; err != nil {
		writeError(w, http.StatusInternalServerError, "Failed to retrieve vendor locations")
		return
	}
	writeJSON(w, http.StatusOK, list)
}

// SetLocation creates or updates a vendor location mapping
func (h *VendorLocationHandler) SetLocation(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Access-Control-Allow-Origin", "*")
	var req struct {
		VendorName  string `json:"vendor_name"`
		Subdistrict string `json:"subdistrict"`
	}
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		writeError(w, http.StatusBadRequest, "Invalid request body")
		return
	}

	if req.VendorName == "" {
		writeError(w, http.StatusBadRequest, "VendorName is required")
		return
	}

	var item models.VendorLocation
	err := h.db.Where("vendor_name = ?", req.VendorName).First(&item).Error
	if err == gorm.ErrRecordNotFound {
		item = models.VendorLocation{
			VendorName:  req.VendorName,
			Subdistrict: req.Subdistrict,
		}
		if err := h.db.Create(&item).Error; err != nil {
			writeError(w, http.StatusInternalServerError, "Failed to save vendor location")
			return
		}
	} else if err != nil {
		writeError(w, http.StatusInternalServerError, "Database error")
		return
	} else {
		item.Subdistrict = req.Subdistrict
		if err := h.db.Save(&item).Error; err != nil {
			writeError(w, http.StatusInternalServerError, "Failed to update vendor location")
			return
		}
	}

	writeJSON(w, http.StatusOK, item)
}
