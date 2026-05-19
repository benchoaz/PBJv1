package handlers

import (
	"bytes"
	"encoding/json"
	"fmt"
	"io"
	"log"
	"mime/multipart"
	"net/http"
	"os"
)

// DpaParserURL is the URL of the Python dpa-parser microservice
func getDpaParserURL() string {
	if url := os.Getenv("DPA_PARSER_URL"); url != "" {
		return url
	}
	return "http://dpa-parser:8000"
}

// ParseDPA proxies the uploaded PDF file to the Python dpa-parser microservice
// and returns the structured DPA account data as JSON.
func ParseDPA(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	// Limit upload to 50MB
	r.Body = http.MaxBytesReader(w, r.Body, 50<<20)
	if err := r.ParseMultipartForm(50 << 20); err != nil {
		http.Error(w, "File terlalu besar atau format tidak valid", http.StatusBadRequest)
		return
	}

	file, header, err := r.FormFile("file")
	if err != nil {
		http.Error(w, "Gagal membaca berkas: "+err.Error(), http.StatusBadRequest)
		return
	}
	defer file.Close()

	// Read file contents
	fileBytes, err := io.ReadAll(file)
	if err != nil {
		http.Error(w, "Gagal membaca isi berkas", http.StatusInternalServerError)
		return
	}

	// Build multipart request to forward to Python service
	var buf bytes.Buffer
	writer := multipart.NewWriter(&buf)

	part, err := writer.CreateFormFile("file", header.Filename)
	if err != nil {
		http.Error(w, "Gagal membuat request ke parser", http.StatusInternalServerError)
		return
	}
	if _, err = part.Write(fileBytes); err != nil {
		http.Error(w, "Gagal menulis berkas ke parser", http.StatusInternalServerError)
		return
	}
	writer.Close()

	// Forward to Python dpa-parser
	parserURL := fmt.Sprintf("%s/parse-dpa", getDpaParserURL())
	req, err := http.NewRequest(http.MethodPost, parserURL, &buf)
	if err != nil {
		http.Error(w, "Gagal membuat request ke parser", http.StatusInternalServerError)
		return
	}
	req.Header.Set("Content-Type", writer.FormDataContentType())
	
	// Meneruskan konfigurasi AI Key secara dinamis jika dikirim oleh frontend
	if provider := r.Header.Get("X-AI-Provider"); provider != "" {
		req.Header.Set("X-AI-Provider", provider)
	}
	if key := r.Header.Get("X-AI-Key"); key != "" {
		req.Header.Set("X-AI-Key", key)
	}

	client := &http.Client{}
	resp, err := client.Do(req)
	if err != nil {
		log.Printf("DPA Parser error: %v", err)
		http.Error(w, "Layanan DPA Parser tidak tersedia: "+err.Error(), http.StatusServiceUnavailable)
		return
	}
	defer resp.Body.Close()

	respBody, err := io.ReadAll(resp.Body)
	if err != nil {
		http.Error(w, "Gagal membaca respons dari parser", http.StatusInternalServerError)
		return
	}

	// Return the parser response directly to the frontend
	w.Header().Set("Content-Type", "application/json")
	w.Header().Set("Access-Control-Allow-Origin", "*")
	w.WriteHeader(resp.StatusCode)

	if _, err := w.Write(respBody); err != nil {
		log.Printf("Error writing response: %v", err)
	}
}

// ParseDPAOptions handles CORS preflight for the DPA parse endpoint
func ParseDPAOptions(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Access-Control-Allow-Origin", "*")
	w.Header().Set("Access-Control-Allow-Methods", "POST, OPTIONS")
	w.Header().Set("Access-Control-Allow-Headers", "Content-Type, Authorization")
	w.WriteHeader(http.StatusNoContent)
}

// DpaHealthCheck checks if the Python dpa-parser service is up
func DpaHealthCheck(w http.ResponseWriter, r *http.Request) {
	parserURL := fmt.Sprintf("%s/health", getDpaParserURL())
	resp, err := http.Get(parserURL)
	if err != nil {
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusServiceUnavailable)
		json.NewEncoder(w).Encode(map[string]string{
			"status":  "unavailable",
			"message": "DPA Parser service tidak tersedia",
		})
		return
	}
	defer resp.Body.Close()

	body, _ := io.ReadAll(resp.Body)
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(resp.StatusCode)
	w.Write(body)
}

// AlignRincian forwards alignment requests directly to the Python dpa-parser service
func AlignRincian(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	bodyBytes, err := io.ReadAll(r.Body)
	if err != nil {
		http.Error(w, "Failed to read request body", http.StatusBadRequest)
		return
	}

	parserURL := fmt.Sprintf("%s/align-rincian", getDpaParserURL())
	req, err := http.NewRequest(http.MethodPost, parserURL, bytes.NewBuffer(bodyBytes))
	if err != nil {
		http.Error(w, "Failed to create request", http.StatusInternalServerError)
		return
	}
	req.Header.Set("Content-Type", "application/json")

	client := &http.Client{}
	resp, err := client.Do(req)
	if err != nil {
		log.Printf("AlignRincian proxy error: %v", err)
		http.Error(w, "Parser service unavailable: "+err.Error(), http.StatusServiceUnavailable)
		return
	}
	defer resp.Body.Close()

	respBody, err := io.ReadAll(resp.Body)
	if err != nil {
		http.Error(w, "Failed to read response body", http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	w.Header().Set("Access-Control-Allow-Origin", "*")
	w.WriteHeader(resp.StatusCode)
	w.Write(respBody)
}

// AlignRincianOptions handles CORS preflight for the DPA alignment endpoint
func AlignRincianOptions(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Access-Control-Allow-Origin", "*")
	w.Header().Set("Access-Control-Allow-Methods", "POST, OPTIONS")
	w.Header().Set("Access-Control-Allow-Headers", "Content-Type, Authorization")
	w.WriteHeader(http.StatusNoContent)
}

