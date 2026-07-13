package handlers

import (
	"encoding/json"
	"fmt"
	"net/http"

	"gorm.io/gorm"
)

type AIRefineTextRequest struct {
	RawText    string `json:"raw_text"`
	Context    string `json:"context"` // e.g., "Catatan Hasil Negosiasi", "Evaluasi Kinerja Penyedia"
	AIProvider string `json:"ai_provider"`
	AIKey      string `json:"ai_key"`
}

type AIRefineTextResponse struct {
	Success     bool   `json:"success"`
	RefinedText string `json:"refined_text"`
	Provider    string `json:"provider,omitempty"`
	Error       string `json:"error,omitempty"`
}

type RefineTextHandler struct {
	db *gorm.DB
}

func NewRefineTextHandler(db *gorm.DB) *RefineTextHandler {
	return &RefineTextHandler{db: db}
}

// RefineText handles POST /api/ai/refine-text
// Uses AI with automatic fallback to refine/improve Indonesian procurement text.
func (h *RefineTextHandler) Handle(w http.ResponseWriter, r *http.Request) {
	setCORSHeaders(w)
	if r.Method == http.MethodOptions {
		w.WriteHeader(http.StatusOK)
		return
	}

	var req AIRefineTextRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		writeError(w, http.StatusBadRequest, "Invalid request body")
		return
	}

	if req.RawText == "" {
		writeError(w, http.StatusBadRequest, "raw_text tidak boleh kosong")
		return
	}

	prompt := fmt.Sprintf(`Anda adalah auditor dan ahli hukum pengadaan barang/jasa pemerintah (Perpres 12/2021).
Pejabat Pengadaan (PP) sedang menulis bagian "%s" untuk dokumen pengadaan.

Teks draf/mentah dari PP: "%s"

Tugas Anda:
Perbaiki teks tersebut agar baku, profesional, dan bernada hukum/resmi yang pantas masuk ke dokumen pengadaan pemerintah Indonesia.
Pertahankan makna dan informasi aslinya, hanya perbaiki gaya bahasa, tata kalimat, dan keformalan.

Hasilkan JSON persis seperti ini:
{
  "refined_text": "Teks yang sudah disempurnakan"
}
Output HANYA JSON murni tanpa blok markdown.`, req.Context, req.RawText)

	aiResponse, err := callAIWithFallback(h.db, req.AIProvider, req.AIKey, prompt)
	if err != nil {
		writeError(w, http.StatusInternalServerError, err.Error())
		return
	}

	// Strip markdown code fences if present
	cleaned := stripMarkdownJSON(aiResponse)

	var refined struct {
		RefinedText string `json:"refined_text"`
	}
	if jsonErr := json.Unmarshal([]byte(cleaned), &refined); jsonErr != nil {
		// AI returned plain text instead of JSON — use as-is
		writeJSON(w, http.StatusOK, AIRefineTextResponse{
			Success:     true,
			RefinedText: aiResponse,
		})
		return
	}

	writeJSON(w, http.StatusOK, AIRefineTextResponse{
		Success:     true,
		RefinedText: refined.RefinedText,
	})
}

// RefineText is kept as a package-level function for backward compatibility with existing routes.
// New code should use RefineTextHandler.Handle instead.
func RefineText(w http.ResponseWriter, r *http.Request) {
	setCORSHeaders(w)
	if r.Method == http.MethodOptions {
		w.WriteHeader(http.StatusOK)
		return
	}

	var req AIRefineTextRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		writeError(w, http.StatusBadRequest, "Invalid request body")
		return
	}

	prompt := fmt.Sprintf(`Anda adalah auditor dan ahli hukum pengadaan barang/jasa pemerintah (Perpres 12/2021).
Pejabat Pengadaan (PP) sedang menulis bagian "%s" untuk dokumen pengadaan.

Teks draf/mentah dari PP: "%s"

Tugas Anda:
Perbaiki teks tersebut agar baku, profesional, dan bernada hukum/resmi yang pantas masuk ke dokumen pengadaan pemerintah Indonesia.
Pertahankan makna dan informasi aslinya, hanya perbaiki gaya bahasa, tata kalimat, dan keformalan.

Hasilkan JSON persis seperti ini:
{
  "refined_text": "Teks yang sudah disempurnakan"
}
Output HANYA JSON murni tanpa blok markdown.`, req.Context, req.RawText)

	// Use fallback with nil DB — will return error if no key provided inline
	aiResponse, err := callAIWithFallback(nil, req.AIProvider, req.AIKey, prompt)
	if err != nil {
		writeError(w, http.StatusInternalServerError, err.Error())
		return
	}

	cleaned := stripMarkdownJSON(aiResponse)

	var refined struct {
		RefinedText string `json:"refined_text"`
	}
	if jsonErr := json.Unmarshal([]byte(cleaned), &refined); jsonErr != nil {
		writeJSON(w, http.StatusOK, AIRefineTextResponse{
			Success:     true,
			RefinedText: aiResponse,
		})
		return
	}

	writeJSON(w, http.StatusOK, AIRefineTextResponse{
		Success:     true,
		RefinedText: refined.RefinedText,
	})
}

func stripMarkdownJSON(s string) string {
	if len(s) > 7 && s[:7] == "```json" {
		s = s[7:]
		if len(s) > 3 && s[len(s)-3:] == "```" {
			s = s[:len(s)-3]
		}
	} else if len(s) > 3 && s[:3] == "```" {
		s = s[3:]
		if len(s) > 3 && s[len(s)-3:] == "```" {
			s = s[:len(s)-3]
		}
	}
	return s
}
