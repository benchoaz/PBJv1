package handlers

import (
	"encoding/json"
	"net/http"
	"pbj/internal/models"
	"pbj/internal/repository"
	"strconv"
	"strings"
)

type BahpHandler struct {
	bahpRepo    *repository.BahpRepository
	projectRepo *repository.ProjectRepository
}

func NewBahpHandler(bahpRepo *repository.BahpRepository, projectRepo *repository.ProjectRepository) *BahpHandler {
	return &BahpHandler{
		bahpRepo:    bahpRepo,
		projectRepo: projectRepo,
	}
}

func (h *BahpHandler) hasAccessToSatker(userRole, userSatker, targetSatker string) bool {
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

// Create handles POST /api/projects/{id}/bahp
func (h *BahpHandler) Create(w http.ResponseWriter, r *http.Request) {
	pathParts := strings.Split(r.URL.Path, "/")
	if len(pathParts) < 5 {
		writeError(w, http.StatusBadRequest, "Invalid project ID format")
		return
	}

	projectIDStr := pathParts[3]
	projectID, err := strconv.ParseInt(projectIDStr, 10, 64)
	if err != nil {
		writeError(w, http.StatusBadRequest, "Invalid project ID")
		return
	}

	project, err := h.projectRepo.GetByID(projectID)
	if err != nil || project == nil {
		writeError(w, http.StatusNotFound, "Project not found")
		return
	}

	userRole := r.Header.Get("X-User-Role")
	userSatker := r.Header.Get("X-User-Satker")
	if userRole != "" && strings.ToLower(userRole) != "admin" {
		if !h.hasAccessToSatker(userRole, userSatker, project.IdSatker) {
			writeError(w, http.StatusForbidden, "Forbidden: Anda tidak memiliki akses ke proyek satker lain")
			return
		}
	}

	var req models.BahpCreate
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		writeError(w, http.StatusBadRequest, "Invalid request payload")
		return
	}

	// Serialize items array to JSON
	itemsJSON := "[]"
	if len(req.Items) > 0 {
		itemsBytes, err := json.Marshal(req.Items)
		if err == nil {
			itemsJSON = string(itemsBytes)
		}
		// Set legacy vendor fields from first item for backward compat
		if req.VendorName == "" && len(req.Items) > 0 {
			req.VendorName = req.Items[0].VendorName
			req.CatalogURL = req.Items[0].CatalogURL
			req.InitialPrice = req.Items[0].InitialPrice
			req.NegotiatedPrice = req.Items[0].NegotiatedPrice
			req.ShippingCost = req.Items[0].ShippingCost
			req.ScreenshotURL = req.Items[0].ScreenshotURL
		}
	}

	// Auto-detect package type if not provided
	packageType := req.PackageType
	if packageType == "" {
		packageType = "ATK"
	}

	status := req.Status
	if status == "" {
		status = "Draft"
	}

	bahp := &models.BahpDocument{
		ProjectID:           projectID,
		DocumentNumber:      req.DocumentNumber,
		VendorName:          req.VendorName,
		VendorAddress:       req.VendorAddress,
		CatalogURL:          req.CatalogURL,
		InitialPrice:        req.InitialPrice,
		NegotiatedPrice:     req.NegotiatedPrice,
		ShippingCost:        req.ShippingCost,
		ScreenshotURL:       req.ScreenshotURL,
		FileURL:             "",
		ItemsJSON:           itemsJSON,
		PackageType:         packageType,
		DeliveryLocation:    req.DeliveryLocation,
		HasExceptions:       req.HasExceptions,
		ExceptionNotes:      req.ExceptionNotes,
		PPKApprovedContinue: req.PPKApprovedContinue,
		Status:              status,
	}

	err = h.bahpRepo.Create(bahp)
	if err != nil {
		writeError(w, http.StatusInternalServerError, "Failed to create BAHP document: "+err.Error())
		return
	}

	// Update project status to "Disetujui PP"
	statusStr := "Disetujui PP"
	updateReq := &models.ProjectUpdate{
		Status: &statusStr,
	}
	h.projectRepo.Update(projectID, updateReq)

	writeJSON(w, http.StatusCreated, bahp)
}

// GetByProject handles GET /api/projects/{id}/bahp
func (h *BahpHandler) GetByProject(w http.ResponseWriter, r *http.Request) {
	pathParts := strings.Split(r.URL.Path, "/")
	if len(pathParts) < 5 {
		writeError(w, http.StatusBadRequest, "Invalid project ID format")
		return
	}

	projectIDStr := pathParts[3]
	projectID, err := strconv.ParseInt(projectIDStr, 10, 64)
	if err != nil {
		writeError(w, http.StatusBadRequest, "Invalid project ID")
		return
	}

	project, err := h.projectRepo.GetByID(projectID)
	if err != nil || project == nil {
		writeError(w, http.StatusNotFound, "Project not found")
		return
	}

	userRole := r.Header.Get("X-User-Role")
	userSatker := r.Header.Get("X-User-Satker")
	if userRole != "" && strings.ToLower(userRole) != "admin" {
		if !h.hasAccessToSatker(userRole, userSatker, project.IdSatker) {
			writeError(w, http.StatusForbidden, "Forbidden: Anda tidak memiliki akses ke proyek satker lain")
			return
		}
	}

	bahp, err := h.bahpRepo.GetByProjectID(projectID)
	if err != nil {
		writeError(w, http.StatusInternalServerError, "Failed to fetch BAHP document")
		return
	}

	if bahp == nil {
		writeError(w, http.StatusNotFound, "BAHP not found for this project")
		return
	}

	writeJSON(w, http.StatusOK, bahp)
}
