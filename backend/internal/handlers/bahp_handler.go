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

// Create handles POST /api/projects/{id}/bahp
func (h *BahpHandler) Create(w http.ResponseWriter, r *http.Request) {
	// Extract project ID from URL manually since we are using standard mux
	pathParts := strings.Split(r.URL.Path, "/")
	// Expected path: /api/projects/123/bahp
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

	var req models.BahpCreate
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		writeError(w, http.StatusBadRequest, "Invalid request payload")
		return
	}

	bahp := &models.BahpDocument{
		ProjectID:       projectID,
		DocumentNumber:  req.DocumentNumber,
		VendorName:      req.VendorName,
		VendorAddress:   req.VendorAddress,
		CatalogURL:      req.CatalogURL,
		InitialPrice:    req.InitialPrice,
		NegotiatedPrice: req.NegotiatedPrice,
		ShippingCost:    req.ShippingCost,
		ScreenshotURL:   req.ScreenshotURL,
		FileURL:         "", // Could be generated/uploaded later
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
	_, err = h.projectRepo.Update(projectID, updateReq)
	if err != nil {
		// Log error but still return success for BAHP creation
	}

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
