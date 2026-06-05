package handlers

import (
	"encoding/json"
	"fmt"
	"net/http"
	"os"
)

type AIExceptionRequest struct {
	UserNote   string `json:"user_note"`
	ItemName   string `json:"item_name"`
	ItemStatus string `json:"item_status"`
	AIProvider string `json:"ai_provider"`
	AIKey      string `json:"ai_key"`
}

type AIExceptionResponse struct {
	Success      bool   `json:"success"`
	IsValid      bool   `json:"is_valid"`
	Advice       string `json:"advice"`
	RefinedNote  string `json:"refined_note"`
	Error        string `json:"error,omitempty"`
}

// RefineException handles POST /api/ai/refine-exception
// Analyzes the PP's reason for a deviation, gives legal advice, and provides formal text.
func RefineException(w http.ResponseWriter, r *http.Request) {
	setCORSHeaders(w)
	if r.Method == http.MethodOptions {
		w.WriteHeader(http.StatusOK)
		return
	}

	var req AIExceptionRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		writeError(w, http.StatusBadRequest, "Invalid request body")
		return
	}

	// Get AI provider and key
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
Pejabat Pengadaan (PP) sedang membuat Catatan Penyimpangan Dokumen Persiapan Pengadaan (DPP) karena ada masalah dengan ketersediaan barang di e-Katalog LKPP.

Kondisi Barang: "%s" dengan status: "%s"
Alasan/Catatan mentah dari PP: "%s"

Tugas Anda:
1. Analisis apakah alasan PP masuk akal dan dapat dipertanggungjawabkan secara hukum. Jika alasannya lemah atau menyalahi aturan, berikan nasihat (advice) yang mendidik.
2. Buat ulang kalimat PP menjadi paragraf hukum yang sangat formal, meyakinkan, dan siap disisipkan ke Berita Acara Hasil Pemilihan (BAHP).

Hasilkan JSON dengan format persis seperti ini:
{
  "is_valid": true/false, // false jika alasannya sangat bermasalah atau butuh koreksi mendasar
  "advice": "Penjelasan/nasihat hukum untuk PP (misal: 'Alasan ini cukup kuat', atau 'Hati-hati, Anda harus memastikan spesifikasi pengganti setara...')",
  "refined_note": "Teks paragraf hukum formal yang sudah diperbaiki dari alasan mentah PP"
}
Output HANYA JSON murni tanpa markdown block.`, req.ItemName, req.ItemStatus, req.UserNote)

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

	// Clean JSON markdown if AI accidentally includes it
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

	var refined AIExceptionResponse
	if jsonErr := json.Unmarshal([]byte(aiResponse), &refined); jsonErr != nil {
		refined = AIExceptionResponse{
			Success:     true,
			IsValid:     true,
			Advice:      "Sistem berhasil memperbaiki format teks, tetapi AI tidak memberikan analisis hukum.",
			RefinedNote: aiResponse,
		}
	} else {
		refined.Success = true
	}

	writeJSON(w, http.StatusOK, refined)
}
