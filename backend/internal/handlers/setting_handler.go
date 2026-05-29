package handlers

import (
	"encoding/json"
	"net/http"

	"pbj/internal/models"

	"gorm.io/gorm"
)

type SettingHandler struct {
	db *gorm.DB
}

func NewSettingHandler(db *gorm.DB) *SettingHandler {
	return &SettingHandler{db: db}
}

// Get Setting by Key
func (h *SettingHandler) GetSetting(w http.ResponseWriter, r *http.Request) {
	key := r.PathValue("key")
	if key == "" {
		writeError(w, http.StatusBadRequest, "Key is required")
		return
	}

	var setting models.AppSetting
	if err := h.db.First(&setting, "key = ?", key).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			// Return empty string instead of 404 to gracefully handle new keys
			writeJSON(w, http.StatusOK, models.AppSetting{Key: key, Value: ""})
			return
		}
		writeError(w, http.StatusInternalServerError, "Failed to retrieve setting")
		return
	}

	writeJSON(w, http.StatusOK, setting)
}

// Set Setting (Upsert)
func (h *SettingHandler) SetSetting(w http.ResponseWriter, r *http.Request) {
	var req models.SettingRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		writeError(w, http.StatusBadRequest, "Invalid request body")
		return
	}

	if req.Key == "" {
		writeError(w, http.StatusBadRequest, "Key is required")
		return
	}

	setting := models.AppSetting{
		Key:   req.Key,
		Value: req.Value,
	}

	// Upsert
	if err := h.db.Save(&setting).Error; err != nil {
		writeError(w, http.StatusInternalServerError, "Failed to save setting")
		return
	}

	writeJSON(w, http.StatusOK, setting)
}
