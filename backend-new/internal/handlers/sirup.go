package handlers

import (
	"encoding/json"
	"fmt"
	"io"
	"net/http"
)

// SirupPackage represents a parsed package from LKPP SIRUP
type SirupPackage struct {
	NoSirup         string `json:"noSirup"`
	PackName        string `json:"packName"`
	Pagu            int    `json:"pagu"`
	Method          string `json:"method"`
	SumberDana      string `json:"sumberDana"`
	Tahun           string `json:"tahun"`
	JadwalPemilihan string `json:"jadwalPemilihan"`
}

// GetSirupPackages fetches live RUP data directly from the official LKPP API
func GetSirupPackages(w http.ResponseWriter, r *http.Request) {
	satkerID := r.PathValue("id")
	if satkerID == "" {
		http.Error(w, "ID Satker wajib diisi", http.StatusBadRequest)
		return
	}

	tahun := r.URL.Query().Get("tahun")
	if tahun == "" {
		tahun = "2026"
	}

	// Fetch up to 2000 records to ensure we get all package data
	lkppURL := fmt.Sprintf(
		"https://sirup.inaproc.id/sirup/datatablectr/dataruppenyediasatker?tahun=%s&idSatker=%s&sEcho=1&iColumns=7&iDisplayStart=0&iDisplayLength=2000",
		tahun,
		satkerID,
	)

	req, err := http.NewRequest(http.MethodGet, lkppURL, nil)
	if err != nil {
		http.Error(w, "Gagal membuat request ke LKPP: "+err.Error(), http.StatusInternalServerError)
		return
	}

	// Add typical browser user agent to prevent block
	req.Header.Set("User-Agent", "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36")

	client := &http.Client{}
	resp, err := client.Do(req)
	if err != nil {
		http.Error(w, "Gagal menghubungi server SIRUP LKPP: "+err.Error(), http.StatusBadGateway)
		return
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		http.Error(w, fmt.Sprintf("LKPP merespon dengan status %d", resp.StatusCode), http.StatusBadGateway)
		return
	}

	bodyBytes, err := io.ReadAll(resp.Body)
	if err != nil {
		http.Error(w, "Gagal membaca data dari LKPP", http.StatusInternalServerError)
		return
	}

	// Struct for Datatables format
	var lkppResponse struct {
		AaData [][]string `json:"aaData"`
	}

	if err := json.Unmarshal(bodyBytes, &lkppResponse); err != nil {
		http.Error(w, "Format JSON LKPP tidak sesuai: "+err.Error(), http.StatusInternalServerError)
		return
	}

	// Parse raw array to structured JSON
	packages := make([]SirupPackage, 0)
	for _, raw := range lkppResponse.AaData {
		if len(raw) < 5 {
			continue
		}

		// Convert pagu string to integer safely
		var paguVal int
		fmt.Sscanf(raw[2], "%d", &paguVal)

		method := raw[3]
		if method == "" || method == "null" {
			method = "Pengadaan Langsung"
		}

		packages = append(packages, SirupPackage{
			NoSirup:         raw[0],
			PackName:        raw[1],
			Pagu:            paguVal,
			Method:          method,
			SumberDana:      raw[4],
			Tahun:           tahun,
			JadwalPemilihan: raw[6],
		})
	}

	w.Header().Set("Content-Type", "application/json")
	w.Header().Set("Access-Control-Allow-Origin", "*")
	json.NewEncoder(w).Encode(map[string]interface{}{
		"success":  true,
		"satkerId": satkerID,
		"tahun":    tahun,
		"total":    len(packages),
		"packages": packages,
	})
}
