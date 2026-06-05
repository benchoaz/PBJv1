package handlers

import (
	"bytes"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"os"
	"time"
)

type BahpRefinementRequest struct {
	// BAHP document data
	PackageType      string      `json:"package_type"`
	DeliveryLocation string      `json:"delivery_location"`
	ExceptionNotes   string      `json:"exception_notes"`
	HasExceptions    bool        `json:"has_exceptions"`
	DocumentDate     string      `json:"document_date"`
	PPName           string      `json:"pp_name"`
	PPKName          string      `json:"ppk_name"`
	UnitName         string      `json:"unit_name"`
	Items            interface{} `json:"items"`
	// AI config
	AIProvider string `json:"ai_provider"` // gemini, groq, openai
	AIKey      string `json:"ai_key"`
}

type BahpRefinementResponse struct {
	Success            bool   `json:"success"`
	RefinedIntro       string `json:"refined_intro"`
	RefinedExceptions  string `json:"refined_exceptions"`
	RefinedConclusion  string `json:"refined_conclusion"`
	RefinedItemNotes   string `json:"refined_item_notes"`
	Error              string `json:"error,omitempty"`
}

// RefineBahp handles POST /api/ai/refine-bahp
// Uses Gemini API to generate legally-worded Indonesian procurement text
func RefineBahp(w http.ResponseWriter, r *http.Request) {
	setCORSHeaders(w)
	if r.Method == http.MethodOptions {
		w.WriteHeader(http.StatusOK)
		return
	}

	var req BahpRefinementRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		writeError(w, http.StatusBadRequest, "Invalid request body")
		return
	}

	// Get AI provider and key — prefer from request, fallback to env
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

	// Build context for the prompt
	today := time.Now().Format("02 January 2006")
	if req.DocumentDate != "" {
		today = req.DocumentDate
	}
	if req.PPName == "" {
		req.PPName = "Pejabat Pengadaan"
	}
	if req.PPKName == "" {
		req.PPKName = "Pejabat Pembuat Komitmen"
	}

	itemsJSON, _ := json.Marshal(req.Items)

	prompt := fmt.Sprintf(`Anda adalah ahli hukum pengadaan barang/jasa pemerintah Indonesia yang berpengalaman dalam menyusun dokumen BAHP (Berita Acara Hasil Pemilihan) sesuai Perpres No. 12 Tahun 2021 dan Peraturan LKPP No. 9 Tahun 2021.

Tugas Anda: Buat teks hukum yang sempurna, rapi, dan sesuai kaidah hukum pengadaan Indonesia untuk dokumen BAHP e-Purchasing Katalog Elektronik.

DATA BAHP:
- Jenis Pengadaan: %s
- Lokasi Pengiriman: %s
- Tanggal: %s
- Nama PP: %s
- Nama PPK: %s
- Unit/Satker: %s
- Ada Penyimpangan: %v
- Catatan Penyimpangan Mentah: %s
- Item Pengadaan (JSON): %s

Hasilkan JSON dengan format TEPAT berikut (tidak perlu penjelasan lain):
{
  "refined_intro": "Teks paragraf pembuka BAHP yang formal dan sesuai hukum (2-3 kalimat, menyebutkan dasar hukum, PP/PPK, tanggal, dan jenis pengadaan)",
  "refined_exceptions": "Teks klausul penyimpangan resmi yang wajib dicantumkan di BAHP jika ada penyimpangan dari DPP (kosongkan jika tidak ada penyimpangan). Gunakan kalimat formal seperti Berita Acara Pengecualian / Catatan Penyimpangan DPP sesuai Perpres 12/2021 Pasal 50",
  "refined_item_notes": "Teks ringkasan hasil negosiasi per item dalam format bullet point formal (nama item, penyedia, harga tayang, harga nego, selisih/penghematan jika ada)",
  "refined_conclusion": "Teks paragraf penutup BAHP yang formal: menyatakan hasil pemilihan, kesesuaian dengan pagu anggaran, dan rekomendasi PP untuk diterbitkan SP (Surat Pesanan)"
}

Gunakan bahasa Indonesia yang formal, lugas, dan sesuai terminologi hukum pengadaan. Hindari kata-kata informal. Pastikan menyebutkan: Perpres 12/2021, e-Purchasing, Katalog Elektronik LKPP (e-Katalog), harga tayang, nilai negosiasi.`,
		req.PackageType, req.DeliveryLocation, today,
		req.PPName, req.PPKName, req.UnitName,
		req.HasExceptions, req.ExceptionNotes, string(itemsJSON))

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

	// Try to parse AI response as JSON
	var refined BahpRefinementResponse
	if jsonErr := json.Unmarshal([]byte(aiResponse), &refined); jsonErr != nil {
		// AI returned non-JSON — wrap it
		refined = BahpRefinementResponse{
			Success:      true,
			RefinedIntro: aiResponse,
		}
	} else {
		refined.Success = true
	}

	writeJSON(w, http.StatusOK, refined)
}

func callGeminiAPI(apiKey, prompt string) (string, error) {
	url := fmt.Sprintf("https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=%s", apiKey)

	body := map[string]interface{}{
		"contents": []map[string]interface{}{
			{
				"parts": []map[string]string{
					{"text": prompt},
				},
			},
		},
		"generationConfig": map[string]interface{}{
			"temperature":     0.3,
			"maxOutputTokens": 2048,
		},
	}

	bodyBytes, _ := json.Marshal(body)
	resp, err := http.Post(url, "application/json", bytes.NewReader(bodyBytes))
	if err != nil {
		return "", err
	}
	defer resp.Body.Close()

	respBytes, err := io.ReadAll(resp.Body)
	if err != nil {
		return "", err
	}

	var geminiResp struct {
		Candidates []struct {
			Content struct {
				Parts []struct {
					Text string `json:"text"`
				} `json:"parts"`
			} `json:"content"`
		} `json:"candidates"`
		Error *struct {
			Message string `json:"message"`
		} `json:"error"`
	}

	if err := json.Unmarshal(respBytes, &geminiResp); err != nil {
		return "", fmt.Errorf("parse error: %v, body: %s", err, string(respBytes[:min(200, len(respBytes))]))
	}
	if geminiResp.Error != nil {
		return "", fmt.Errorf("Gemini error: %s", geminiResp.Error.Message)
	}
	if len(geminiResp.Candidates) == 0 || len(geminiResp.Candidates[0].Content.Parts) == 0 {
		return "", fmt.Errorf("no response from Gemini")
	}

	return geminiResp.Candidates[0].Content.Parts[0].Text, nil
}

func callGroqAPI(apiKey, prompt string) (string, error) {
	url := "https://api.groq.com/openai/v1/chat/completions"

	body := map[string]interface{}{
		"model": "llama-3.3-70b-versatile",
		"messages": []map[string]string{
			{"role": "user", "content": prompt},
		},
		"temperature":     0.3,
		"max_tokens":      2048,
		"response_format": map[string]string{"type": "json_object"},
	}

	bodyBytes, _ := json.Marshal(body)
	req, err := http.NewRequest("POST", url, bytes.NewReader(bodyBytes))
	if err != nil {
		return "", err
	}
	req.Header.Set("Content-Type", "application/json")
	req.Header.Set("Authorization", "Bearer "+apiKey)

	client := &http.Client{}
	resp, err := client.Do(req)
	if err != nil {
		return "", err
	}
	defer resp.Body.Close()

	respBytes, _ := io.ReadAll(resp.Body)

	var groqResp struct {
		Choices []struct {
			Message struct {
				Content string `json:"content"`
			} `json:"message"`
		} `json:"choices"`
		Error *struct {
			Message string `json:"message"`
		} `json:"error"`
	}

	if err := json.Unmarshal(respBytes, &groqResp); err != nil {
		return "", fmt.Errorf("parse error: %v", err)
	}
	if groqResp.Error != nil {
		return "", fmt.Errorf("Groq error: %s", groqResp.Error.Message)
	}
	if len(groqResp.Choices) == 0 {
		return "", fmt.Errorf("no response from Groq")
	}

	return groqResp.Choices[0].Message.Content, nil
}

func setCORSHeaders(w http.ResponseWriter) {
	w.Header().Set("Access-Control-Allow-Origin", "*")
	w.Header().Set("Access-Control-Allow-Methods", "POST, GET, OPTIONS")
	w.Header().Set("Access-Control-Allow-Headers", "Content-Type, X-AI-Provider, X-AI-Key")
}

func min(a, b int) int {
	if a < b {
		return a
	}
	return b
}
