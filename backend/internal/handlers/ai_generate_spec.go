package handlers

import (
	"encoding/json"
	"fmt"
	"net/http"
	"os"
)

type AIGenerateSpecRequest struct {
	ProductName string `json:"product_name"`
	AIProvider  string `json:"ai_provider"`
	AIKey       string `json:"ai_key"`
}

type AIGenerateSpecResponse struct {
	Success        bool   `json:"success"`
	Specifications string `json:"specifications"`
	Error          string `json:"error,omitempty"`
}

// GenerateSpec handles POST /api/ai/generate-spec
// Uses Gemini/Groq API to generate a realistic technical specification summary for a product name.
func GenerateSpec(w http.ResponseWriter, r *http.Request) {
	setCORSHeaders(w)
	if r.Method == http.MethodOptions {
		w.WriteHeader(http.StatusOK)
		return
	}

	var req AIGenerateSpecRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		writeError(w, http.StatusBadRequest, "Invalid request body")
		return
	}

	if req.ProductName == "" {
		writeError(w, http.StatusBadRequest, "Nama produk tidak boleh kosong")
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

	prompt := fmt.Sprintf(`Anda adalah asisten ahli pengadaan barang/jasa pemerintah Indonesia.
Tugas Anda adalah membuat deskripsi parameter teknis/spesifikasi mutu singkat, padat, dan realistis untuk produk berikut dalam Bahasa Indonesia (maksimal 2 kalimat atau 30 kata).

NAMA PRODUK: "%s"

Hasilkan JSON dengan format TEPAT berikut (tanpa penjelasan lain):
{
  "specifications": "Spesifikasi hasil generate yang singkat, padat, dan formal"
}
Output HANYA JSON murni tanpa blok markdown.`, req.ProductName)

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

	// Clean JSON markdown blocks if any
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

	var result AIGenerateSpecResponse
	if jsonErr := json.Unmarshal([]byte(aiResponse), &result); jsonErr != nil {
		// fallback if AI didn't return valid JSON
		result = AIGenerateSpecResponse{
			Success:        true,
			Specifications: aiResponse,
		}
	} else {
		result.Success = true
	}

	writeJSON(w, http.StatusOK, result)
}
