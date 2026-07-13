package handlers

import (
	"encoding/json"
	"fmt"
	"net/http"
	"strconv"
	"strings"

	"pbj/internal/models"
	"pbj/internal/repository"
)

type ProjectHandler struct {
	repo *repository.ProjectRepository
}

func NewProjectHandler(repo *repository.ProjectRepository) *ProjectHandler {
	return &ProjectHandler{repo: repo}
}

func hasAccessToSatker(userRole, userSatker, targetSatker string) bool {
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

func (h *ProjectHandler) GetAll(w http.ResponseWriter, r *http.Request) {
	userRole := r.Header.Get("X-User-Role")
	userSatker := r.Header.Get("X-User-Satker")

	idSatkerFilter := r.URL.Query().Get("idSatker")
	if userRole != "" && strings.ToLower(userRole) != "admin" {
		if userSatker == "" {
			writeJSON(w, http.StatusOK, []*models.Project{})
			return
		}
		if idSatkerFilter != "" {
			if !hasAccessToSatker(userRole, userSatker, idSatkerFilter) {
				writeError(w, http.StatusForbidden, "Forbidden: Anda tidak memiliki akses ke satker ini")
				return
			}
		} else {
			idSatkerFilter = userSatker
		}
	}

	filter := &models.ProjectFilter{
		Ministry:  r.URL.Query().Get("ministry"),
		Province:  r.URL.Query().Get("province"),
		IdSatker:  idSatkerFilter,
		Status:    r.URL.Query().Get("status"),
		MinBudget: parseQueryParamFloat(r, "min_budget"),
		MaxBudget: parseQueryParamFloat(r, "max_budget"),
		Limit:     parseQueryParamInt(r, "limit"),
		Offset:    parseQueryParamInt(r, "offset"),
	}

	projects, err := h.repo.GetAll(filter)
	if err != nil {
		writeError(w, http.StatusInternalServerError, "Failed to fetch projects")
		return
	}

	writeJSON(w, http.StatusOK, projects)
}

func (h *ProjectHandler) GetByID(w http.ResponseWriter, r *http.Request) {
	id, err := strconv.ParseInt(r.PathValue("id"), 10, 64)
	if err != nil {
		writeError(w, http.StatusBadRequest, "Invalid project ID")
		return
	}

	project, err := h.repo.GetByID(id)
	if err != nil {
		writeError(w, http.StatusInternalServerError, "Failed to fetch project")
		return
	}
	if project == nil {
		writeError(w, http.StatusNotFound, "Project not found")
		return
	}

	userRole := r.Header.Get("X-User-Role")
	userSatker := r.Header.Get("X-User-Satker")
	if userRole != "" && strings.ToLower(userRole) != "admin" {
		if !hasAccessToSatker(userRole, userSatker, project.IdSatker) {
			writeError(w, http.StatusForbidden, "Forbidden: Anda tidak memiliki akses ke proyek satker lain")
			return
		}
	}

	writeJSON(w, http.StatusOK, project)
}

func (h *ProjectHandler) Create(w http.ResponseWriter, r *http.Request) {
	var input models.ProjectCreate
	if err := json.NewDecoder(r.Body).Decode(&input); err != nil {
		writeError(w, http.StatusBadRequest, "Invalid request body")
		return
	}

	if input.Name == "" {
		writeError(w, http.StatusBadRequest, "Name is required")
		return
	}

	userRole := r.Header.Get("X-User-Role")
	userSatker := r.Header.Get("X-User-Satker")
	if userRole != "" && strings.ToLower(userRole) != "admin" {
		if !hasAccessToSatker(userRole, userSatker, input.IdSatker) {
			writeError(w, http.StatusForbidden, "Forbidden: Anda tidak diizinkan membuat proyek untuk satker lain")
			return
		}
	}

	project, err := h.repo.Create(&input)
	if err != nil {
		fmt.Printf("Create project error: %v\n", err)
		writeError(w, http.StatusInternalServerError, "Failed to create project: "+err.Error())
		return
	}

	writeJSON(w, http.StatusCreated, project)
}

func (h *ProjectHandler) Update(w http.ResponseWriter, r *http.Request) {
	id, err := strconv.ParseInt(r.PathValue("id"), 10, 64)
	if err != nil {
		writeError(w, http.StatusBadRequest, "Invalid project ID")
		return
	}

	var input models.ProjectUpdate
	if err := json.NewDecoder(r.Body).Decode(&input); err != nil {
		writeError(w, http.StatusBadRequest, "Invalid request body")
		return
	}

	existing, err := h.repo.GetByID(id)
	if err != nil || existing == nil {
		writeError(w, http.StatusNotFound, "Project not found")
		return
	}

	userRole := r.Header.Get("X-User-Role")
	userSatker := r.Header.Get("X-User-Satker")
	if userRole != "" && strings.ToLower(userRole) != "admin" {
		if !hasAccessToSatker(userRole, userSatker, existing.IdSatker) {
			writeError(w, http.StatusForbidden, "Forbidden: Anda tidak memiliki akses untuk mengupdate proyek satker lain")
			return
		}
		if input.IdSatker != nil && !hasAccessToSatker(userRole, userSatker, *input.IdSatker) {
			writeError(w, http.StatusForbidden, "Forbidden: Anda tidak memiliki akses ke satker baru")
			return
		}
	}

	project, err := h.repo.Update(id, &input)
	if err != nil {
		writeError(w, http.StatusInternalServerError, "Failed to update project")
		return
	}
	if project == nil {
		writeError(w, http.StatusNotFound, "Project not found")
		return
	}

	writeJSON(w, http.StatusOK, project)
}

func (h *ProjectHandler) Delete(w http.ResponseWriter, r *http.Request) {
	id, err := strconv.ParseInt(r.PathValue("id"), 10, 64)
	if err != nil {
		writeError(w, http.StatusBadRequest, "Invalid project ID")
		return
	}

	existing, err := h.repo.GetByID(id)
	if err != nil || existing == nil {
		writeError(w, http.StatusNotFound, "Project not found")
		return
	}

	userRole := r.Header.Get("X-User-Role")
	userSatker := r.Header.Get("X-User-Satker")
	if userRole != "" && strings.ToLower(userRole) != "admin" {
		if !hasAccessToSatker(userRole, userSatker, existing.IdSatker) {
			writeError(w, http.StatusForbidden, "Forbidden: Anda tidak memiliki akses untuk menghapus proyek satker lain")
			return
		}
	}

	if err := h.repo.Delete(id); err != nil {
		writeError(w, http.StatusInternalServerError, "Failed to delete project")
		return
	}

	w.WriteHeader(http.StatusNoContent)
}

func (h *ProjectHandler) Stats(w http.ResponseWriter, r *http.Request) {
	userRole := r.Header.Get("X-User-Role")
	userSatker := r.Header.Get("X-User-Satker")

	idSatkerFilter := r.URL.Query().Get("idSatker")
	if userRole != "" && strings.ToLower(userRole) != "admin" {
		if userSatker == "" {
			writeJSON(w, http.StatusOK, map[string]interface{}{"total_projects": 0})
			return
		}
		if idSatkerFilter != "" {
			if !hasAccessToSatker(userRole, userSatker, idSatkerFilter) {
				writeError(w, http.StatusForbidden, "Forbidden: Anda tidak memiliki akses ke satker ini")
				return
			}
		} else {
			idSatkerFilter = userSatker
		}
	}

	total, err := h.repo.Count(&models.ProjectFilter{
		IdSatker: idSatkerFilter,
	})
	if err != nil {
		writeError(w, http.StatusInternalServerError, "Failed to fetch stats")
		return
	}

	stats := map[string]interface{}{
		"total_projects": total,
	}
	writeJSON(w, http.StatusOK, stats)
}

func parseQueryParamInt(r *http.Request, key string) int {
	val := r.URL.Query().Get(key)
	if val == "" {
		return 0
	}
	num, _ := strconv.Atoi(val)
	return num
}

func parseQueryParamFloat(r *http.Request, key string) float64 {
	val := r.URL.Query().Get(key)
	if val == "" {
		return 0
	}
	num, _ := strconv.ParseFloat(val, 64)
	return num
}

func (h *ProjectHandler) Finalize(w http.ResponseWriter, r *http.Request) {
	id, err := strconv.ParseInt(r.PathValue("id"), 10, 64)
	if err != nil {
		writeError(w, http.StatusBadRequest, "Invalid project ID")
		return
	}

	existing, err := h.repo.GetByID(id)
	if err != nil || existing == nil {
		writeError(w, http.StatusNotFound, "Project not found")
		return
	}

	userRole := r.Header.Get("X-User-Role")
	userSatker := r.Header.Get("X-User-Satker")
	if userRole != "" && strings.ToLower(userRole) != "admin" {
		if !hasAccessToSatker(userRole, userSatker, existing.IdSatker) {
			writeError(w, http.StatusForbidden, "Forbidden: Anda tidak memiliki akses untuk memfinalisasi proyek satker lain")
			return
		}
	}

	if err := h.repo.Finalize(id); err != nil {
		writeError(w, http.StatusInternalServerError, "Gagal memfinalisasi anggaran: "+err.Error())
		return
	}

	writeJSON(w, http.StatusOK, map[string]interface{}{"success": true, "message": "Anggaran berhasil dikunci"})
}

func writeJSON(w http.ResponseWriter, status int, data interface{}) {

	w.Header().Set("Access-Control-Allow-Origin", "*")
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(status)
	json.NewEncoder(w).Encode(data)
}

func writeError(w http.ResponseWriter, status int, message string) {
	w.Header().Set("Access-Control-Allow-Origin", "*")
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(status)
	json.NewEncoder(w).Encode(map[string]string{"error": message})
}