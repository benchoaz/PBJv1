package handlers

import (
	"encoding/json"
	"net/http"
	"pbj/internal/models"
	"strconv"
	"strings"

	"gorm.io/gorm"
)

type AddendumHandler struct {
	DB *gorm.DB
}

func NewAddendumHandler(db *gorm.DB) *AddendumHandler {
	return &AddendumHandler{DB: db}
}

func (h *AddendumHandler) hasAccessToSatker(userRole, userSatker, targetSatker string) bool {
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

func (h *AddendumHandler) enableCors(w *http.ResponseWriter) {
	(*w).Header().Set("Access-Control-Allow-Origin", "*")
	(*w).Header().Set("Access-Control-Allow-Methods", "GET, POST, PUT, OPTIONS")
	(*w).Header().Set("Access-Control-Allow-Headers", "Content-Type, X-User-Role, X-User-Satker")
}

func (h *AddendumHandler) Options(w http.ResponseWriter, r *http.Request) {
	h.enableCors(&w)
	w.WriteHeader(http.StatusOK)
}

// GET /api/projects/{id}/addendum
func (h *AddendumHandler) GetAddendum(w http.ResponseWriter, r *http.Request) {
	h.enableCors(&w)
	if r.Method == http.MethodOptions {
		w.WriteHeader(http.StatusOK)
		return
	}

	pathParts := strings.Split(r.URL.Path, "/")
	if len(pathParts) < 4 {
		writeError(w, http.StatusBadRequest, "Invalid URL format")
		return
	}

	projectIDStr := pathParts[3]
	projectID, err := strconv.ParseInt(projectIDStr, 10, 64)
	if err != nil {
		writeError(w, http.StatusBadRequest, "Invalid project ID")
		return
	}

	var project models.Project
	if err := h.DB.First(&project, projectID).Error; err != nil {
		writeError(w, http.StatusNotFound, "Project not found")
		return
	}

	userRole := r.Header.Get("X-User-Role")
	userSatker := r.Header.Get("X-User-Satker")
	if userRole != "" && strings.ToLower(userRole) != "admin" {
		if !h.hasAccessToSatker(userRole, userSatker, project.IdSatker) {
			writeError(w, http.StatusForbidden, "Forbidden: Anda tidak memiliki akses ke satker ini")
			return
		}
	}

	var addendum models.ProjectAddendum
	err = h.DB.Where("project_id = ?", projectID).Order("id DESC").First(&addendum).Error
	if err != nil {
		if err == gorm.ErrRecordNotFound {
			w.Header().Set("Content-Type", "application/json")
			w.WriteHeader(http.StatusOK)
			json.NewEncoder(w).Encode(nil)
			return
		}
		writeError(w, http.StatusInternalServerError, "Failed to retrieve addendum: "+err.Error())
		return
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusOK)
	json.NewEncoder(w).Encode(addendum)
}

// POST /api/projects/{id}/addendum
func (h *AddendumHandler) SaveAddendum(w http.ResponseWriter, r *http.Request) {
	h.enableCors(&w)
	if r.Method == http.MethodOptions {
		w.WriteHeader(http.StatusOK)
		return
	}

	pathParts := strings.Split(r.URL.Path, "/")
	if len(pathParts) < 4 {
		writeError(w, http.StatusBadRequest, "Invalid URL format")
		return
	}

	projectIDStr := pathParts[3]
	projectID, err := strconv.ParseInt(projectIDStr, 10, 64)
	if err != nil {
		writeError(w, http.StatusBadRequest, "Invalid project ID")
		return
	}

	var project models.Project
	if err := h.DB.First(&project, projectID).Error; err != nil {
		writeError(w, http.StatusNotFound, "Project not found")
		return
	}

	userRole := r.Header.Get("X-User-Role")
	userSatker := r.Header.Get("X-User-Satker")
	if userRole != "" && strings.ToLower(userRole) != "admin" {
		if !h.hasAccessToSatker(userRole, userSatker, project.IdSatker) {
			writeError(w, http.StatusForbidden, "Forbidden: Anda tidak memiliki akses ke satker ini")
			return
		}
	}

	var req struct {
		DocumentNumber string `json:"document_number"`
		Justification  string `json:"justification"`
		ItemsJSON      string `json:"items_json"`
		Status         string `json:"status"` // "Draft" atau "Verifikasi PP"
	}

	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		writeError(w, http.StatusBadRequest, "Invalid request body")
		return
	}

	// Fetch BAHP document ID
	var bahp models.BahpDocument
	h.DB.Where("project_id = ?", projectID).First(&bahp)

	var addendum models.ProjectAddendum
	err = h.DB.Where("project_id = ?", projectID).Order("id DESC").First(&addendum).Error
	if err != nil && err != gorm.ErrRecordNotFound {
		writeError(w, http.StatusInternalServerError, "DB error: "+err.Error())
		return
	}

	isNew := err == gorm.ErrRecordNotFound

	addendum.ProjectID = projectID
	addendum.BAHPDocumentID = bahp.ID
	addendum.DocumentNumber = req.DocumentNumber
	addendum.Justification = req.Justification
	addendum.ItemsJSON = req.ItemsJSON
	addendum.Status = req.Status

	if isNew {
		addendum.PPKApproved = false
		addendum.PPApproved = false
		if err := h.DB.Create(&addendum).Error; err != nil {
			writeError(w, http.StatusInternalServerError, "Failed to create addendum: "+err.Error())
			return
		}
	} else {
		if err := h.DB.Save(&addendum).Error; err != nil {
			writeError(w, http.StatusInternalServerError, "Failed to update addendum: "+err.Error())
			return
		}
	}

	// If sending for verification, update project status
	if req.Status == "Verifikasi PP" {
		project.Status = "Verifikasi Adendum oleh PP"
		h.DB.Save(&project)
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusOK)
	json.NewEncoder(w).Encode(addendum)
}

// PUT /api/projects/{id}/addendum/verify
func (h *AddendumHandler) VerifyAddendum(w http.ResponseWriter, r *http.Request) {
	h.enableCors(&w)
	if r.Method == http.MethodOptions {
		w.WriteHeader(http.StatusOK)
		return
	}

	pathParts := strings.Split(r.URL.Path, "/")
	if len(pathParts) < 4 {
		writeError(w, http.StatusBadRequest, "Invalid URL format")
		return
	}

	projectIDStr := pathParts[3]
	projectID, err := strconv.ParseInt(projectIDStr, 10, 64)
	if err != nil {
		writeError(w, http.StatusBadRequest, "Invalid project ID")
		return
	}

	var project models.Project
	if err := h.DB.First(&project, projectID).Error; err != nil {
		writeError(w, http.StatusNotFound, "Project not found")
		return
	}

	userRole := r.Header.Get("X-User-Role")
	userSatker := r.Header.Get("X-User-Satker")
	if userRole != "" && strings.ToLower(userRole) != "admin" {
		if !h.hasAccessToSatker(userRole, userSatker, project.IdSatker) {
			writeError(w, http.StatusForbidden, "Forbidden: Anda tidak memiliki akses ke satker ini")
			return
		}
	}

	// Payload can optionally include updated items list (for example, PP uploaded new screenshot/negoprice)
	var req struct {
		ItemsJSON string `json:"items_json"`
	}
	_ = json.NewDecoder(r.Body).Decode(&req)

	var addendum models.ProjectAddendum
	err = h.DB.Where("project_id = ?", projectID).Order("id DESC").First(&addendum).Error
	if err != nil {
		writeError(w, http.StatusNotFound, "Addendum not found")
		return
	}

	if req.ItemsJSON != "" {
		addendum.ItemsJSON = req.ItemsJSON
	}
	addendum.PPApproved = true
	addendum.Status = "Adendum Disetujui PP"
	h.DB.Save(&addendum)

	project.Status = "Adendum Disetujui PP"
	h.DB.Save(&project)

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusOK)
	json.NewEncoder(w).Encode(addendum)
}

// PUT /api/projects/{id}/addendum/finalize
func (h *AddendumHandler) FinalizeAddendum(w http.ResponseWriter, r *http.Request) {
	h.enableCors(&w)
	if r.Method == http.MethodOptions {
		w.WriteHeader(http.StatusOK)
		return
	}

	pathParts := strings.Split(r.URL.Path, "/")
	if len(pathParts) < 4 {
		writeError(w, http.StatusBadRequest, "Invalid URL format")
		return
	}

	projectIDStr := pathParts[3]
	projectID, err := strconv.ParseInt(projectIDStr, 10, 64)
	if err != nil {
		writeError(w, http.StatusBadRequest, "Invalid project ID")
		return
	}

	var project models.Project
	if err := h.DB.First(&project, projectID).Error; err != nil {
		writeError(w, http.StatusNotFound, "Project not found")
		return
	}

	userRole := r.Header.Get("X-User-Role")
	userSatker := r.Header.Get("X-User-Satker")
	if userRole != "" && strings.ToLower(userRole) != "admin" {
		if !h.hasAccessToSatker(userRole, userSatker, project.IdSatker) {
			writeError(w, http.StatusForbidden, "Forbidden: Anda tidak memiliki akses ke satker ini")
			return
		}
	}

	var addendum models.ProjectAddendum
	err = h.DB.Where("project_id = ?", projectID).Order("id DESC").First(&addendum).Error
	if err != nil {
		writeError(w, http.StatusNotFound, "Addendum not found")
		return
	}

	addendum.PPKApproved = true
	addendum.Status = "Selesai"
	h.DB.Save(&addendum)

	// Update project items and status
	project.Status = "Selesai (Adendum)"
	h.DB.Save(&project)

	// Update active project items
	var items []models.BahpItem
	if err := json.Unmarshal([]byte(addendum.ItemsJSON), &items); err == nil {
		// Delete old project items for this project
		h.DB.Where("project_id = ?", projectID).Delete(&models.ProjectItem{})

		// Re-create project items from adendum items
		for _, item := range items {
			pItem := models.ProjectItem{
				ProjectID: projectID,
				Name:      item.ItemName,
				Qty:       item.QtyConfirmed,
				Unit:      item.Unit,
				Price:     item.NegotiatedPrice,
				DpaPrice:  item.InitialPrice,
				Vendor:    item.VendorName,
			}
			h.DB.Create(&pItem)
		}
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusOK)
	json.NewEncoder(w).Encode(addendum)
}
