package handlers

import (
	"encoding/json"
	"fmt"
	"net/http"
	"os"
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
	Error       string `json:"error,omitempty"`
}

// RefineText handles POST /api/ai/refine-text
// Analyzes and refines specific sections of text in the BAHP context.
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

	provider := req.AIProvider
	apiKey := req.AIKey
	if apiKey == "" {
		apiKey = os.Getenv("GEMINI_API_KEY")
		provider = "gemini"
	}
	if apiKey == "" {
		apiKey = os.Getenv("GROQ_API_KEY")
		provider = "groq"
	}
	if apiKey == "" {
		writeError(w, http.StatusBadRequest, "AI API key tidak tersedia. Harap atur API key di menu Pengaturan Admin.")
		return
	}

	prompt := fmt.Sprintf(`Anda adalah auditor dan ahli hukum pengadaan barang/jasa pemerintah (Perpres 12/2021).
Pejabat Pengadaan (PP) sedang menulis bagian "%s" untuk dokumen Berita Acara Hasil Pemilihan (BAHP).

Teks draf/mentah dari PP: "%s"

Tugas Anda:
Perbaiki teks tersebut agar baku, profesional, dan bernada hukum/resmi yang pantas masuk ke dokumen BAHP atau pelaporan SIKAP LKPP.

Hasilkan JSON persis seperti ini:
{
  "refined_text": "Teks yang sudah disempurnakan"
}
Output HANYA JSON murni tanpa blok markdown.`, req.Context, req.RawText)

	var aiResponse string
	var err error

	switch provider {
	case "gemini":
		aiResponse, err = callGeminiAPI(apiKey, prompt)
	case "groq":
		aiResponse, err = callGroqAPI(apiKey, prompt)
	default:
		aiResponse, err = callGeminiAPI(apiKey, prompt)
	}

	if err != nil {
		writeError(w, http.StatusInternalServerError, "Gagal memanggil AI: "+err.Error())
		return
	}

	// Clean JSON markdown
	if len(aiResponse) > 7 && aiResponse[:7] == "```json" {
		aiResponse = aiResponse[7:]
		if len(aiResponse) > 3 && aiResponse[len(aiResponse)-3:] == "```" {
			aiResponse = aiResponse[:len(aiResponse)-3]
		}
	} else if len(aiResponse) > 3 && aiResponse[:3] == "```" {
		aiResponse = aiResponse[3:]
		if len(aiResponse) > 3 && aiResponse[len(aiResponse)-3:] == "```" {
			aiResponse = aiResponse[:len(aiResponse)-3]
		}
	}

	var refined AIRefineTextResponse
	if jsonErr := json.Unmarshal([]byte(aiResponse), &refined); jsonErr != nil {
		// fallback
		refined = AIRefineTextResponse{
			Success:     true,
			RefinedText: aiResponse,
		}
	} else {
		refined.Success = true
	}

	writeJSON(w, http.StatusOK, refined)
}
