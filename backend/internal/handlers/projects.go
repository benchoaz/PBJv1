package handlers

import (
	"encoding/json"
	"fmt"
	"net/http"
	"strconv"

	"pbj/internal/models"
	"pbj/internal/repository"
)

type ProjectHandler struct {
	repo *repository.ProjectRepository
}

func NewProjectHandler(repo *repository.ProjectRepository) *ProjectHandler {
	return &ProjectHandler{repo: repo}
}

func (h *ProjectHandler) GetAll(w http.ResponseWriter, r *http.Request) {
	filter := &models.ProjectFilter{
		Ministry:  r.URL.Query().Get("ministry"),
		Province:  r.URL.Query().Get("province"),
		IdSatker:  r.URL.Query().Get("idSatker"),
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

	if err := h.repo.Delete(id); err != nil {
		writeError(w, http.StatusInternalServerError, "Failed to delete project")
		return
	}

	w.WriteHeader(http.StatusNoContent)
}

func (h *ProjectHandler) Stats(w http.ResponseWriter, r *http.Request) {
	total, err := h.repo.Count(&models.ProjectFilter{
		IdSatker: r.URL.Query().Get("idSatker"),
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