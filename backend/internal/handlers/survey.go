package handlers

import (
	"bytes"
	"encoding/json"
	"log"
	"net/http"
	"os/exec"
	"path/filepath"
)

type SurveyItem struct {
	Name          string `json:"name"`
	Query         string `json:"query"`
	FallbackPrice int    `json:"fallbackPrice"`
}

type SurveyRequest struct {
	Items []SurveyItem `json:"items"`
}

func RunSurvey(w http.ResponseWriter, r *http.Request) {
	// Enable CORS
	w.Header().Set("Access-Control-Allow-Origin", "*")
	w.Header().Set("Access-Control-Allow-Methods", "POST, OPTIONS")
	w.Header().Set("Access-Control-Allow-Headers", "Content-Type")

	if r.Method == http.MethodOptions {
		w.WriteHeader(http.StatusOK)
		return
	}

	var req SurveyRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "Invalid JSON body", http.StatusBadRequest)
		return
	}

	inputBytes, err := json.Marshal(req.Items)
	if err != nil {
		http.Error(w, "Failed to marshal items", http.StatusInternalServerError)
		return
	}

	scriptPath := filepath.Join("..", "survey_runner.js")
	cmd := exec.Command("node", scriptPath)
	
	cmd.Stdin = bytes.NewReader(inputBytes)
	var stdout bytes.Buffer
	var stderr bytes.Buffer
	cmd.Stdout = &stdout
	cmd.Stderr = &stderr

	log.Printf("Starting survey_runner.js for %d items", len(req.Items))
	
	err = cmd.Run()
	if err != nil {
		log.Printf("Survey runner error: %v, stderr: %s", err, stderr.String())
		http.Error(w, "Failed to run survey script: "+stderr.String(), http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	w.Write(stdout.Bytes())
}

func RunSurveyOptions(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Access-Control-Allow-Origin", "*")
	w.Header().Set("Access-Control-Allow-Methods", "POST, OPTIONS")
	w.Header().Set("Access-Control-Allow-Headers", "Content-Type")
	w.WriteHeader(http.StatusOK)
}
