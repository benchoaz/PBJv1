package handlers

import (
	"encoding/json"
	"net/http"

	"pbj/internal/models"
)

type AuthHandler struct{}

func NewAuthHandler() *AuthHandler {
	return &AuthHandler{}
}

func (h *AuthHandler) Login(w http.ResponseWriter, r *http.Request) {
	var req models.LoginRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		writeError(w, http.StatusBadRequest, "Invalid request body")
		return
	}

	if req.Username == "" || req.Password == "" {
		writeError(w, http.StatusBadRequest, "Username and password required")
		return
	}

	resp := &models.LoginResponse{
		Token: "demo-token-" + req.Username,
		User: &models.User{
			ID:       1,
			Username: req.Username,
			Email:    req.Username + "@example.com",
			Role:     "admin",
		},
	}
	writeJSON(w, http.StatusOK, resp)
}

func (h *AuthHandler) Me(w http.ResponseWriter, r *http.Request) {
	user := &models.User{
		ID:       1,
		Username: "demo",
		Email:    "demo@example.com",
		Role:     "admin",
	}
	writeJSON(w, http.StatusOK, user)
}