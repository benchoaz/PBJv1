package handlers

import (
	"encoding/json"
	"net/http"
	"strconv"

	"pbj/internal/models"

	"gorm.io/gorm"
)

type UserHandler struct {
	db *gorm.DB
}

func NewUserHandler(db *gorm.DB) *UserHandler {
	return &UserHandler{db: db}
}

// GetAll Users
func (h *UserHandler) GetAll(w http.ResponseWriter, r *http.Request) {
	var users []models.User
	if err := h.db.Find(&users).Error; err != nil {
		writeError(w, http.StatusInternalServerError, "Failed to retrieve users")
		return
	}
	writeJSON(w, http.StatusOK, users)
}

// Create User
func (h *UserHandler) Create(w http.ResponseWriter, r *http.Request) {
	var user models.User
	if err := json.NewDecoder(r.Body).Decode(&user); err != nil {
		writeError(w, http.StatusBadRequest, "Invalid request body")
		return
	}

	if err := h.db.Create(&user).Error; err != nil {
		writeError(w, http.StatusInternalServerError, "Failed to create user")
		return
	}

	writeJSON(w, http.StatusCreated, user)
}

// Update User
func (h *UserHandler) Update(w http.ResponseWriter, r *http.Request) {
	idStr := r.PathValue("id")
	id, err := strconv.ParseInt(idStr, 10, 64)
	if err != nil {
		writeError(w, http.StatusBadRequest, "Invalid ID")
		return
	}

	var req models.UserUpdate
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		writeError(w, http.StatusBadRequest, "Invalid request body")
		return
	}

	var user models.User
	if err := h.db.First(&user, id).Error; err != nil {
		writeError(w, http.StatusNotFound, "User not found")
		return
	}

	if req.Name != nil {
		user.Name = *req.Name
	}
	if req.NIP != nil {
		user.NIP = *req.NIP
	}
	if req.Role != nil {
		user.Role = *req.Role
	}
	if req.Department != nil {
		user.Department = *req.Department
	}
	if req.IdSatker != nil {
		user.IdSatker = *req.IdSatker
	}
	if req.PerangkatDaerah != nil {
		user.PerangkatDaerah = *req.PerangkatDaerah
	}
	if req.Password != nil {
		user.Password = *req.Password
	}

	if err := h.db.Save(&user).Error; err != nil {
		writeError(w, http.StatusInternalServerError, "Failed to update user")
		return
	}

	writeJSON(w, http.StatusOK, user)
}

// Delete User
func (h *UserHandler) Delete(w http.ResponseWriter, r *http.Request) {
	idStr := r.PathValue("id")
	id, err := strconv.ParseInt(idStr, 10, 64)
	if err != nil {
		writeError(w, http.StatusBadRequest, "Invalid ID")
		return
	}

	if err := h.db.Delete(&models.User{}, id).Error; err != nil {
		writeError(w, http.StatusInternalServerError, "Failed to delete user")
		return
	}

	writeJSON(w, http.StatusNoContent, nil)
}
