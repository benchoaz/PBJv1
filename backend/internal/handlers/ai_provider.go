package handlers

import (
	"encoding/json"
	"fmt"
	"log"

	"gorm.io/gorm"
)

// providerOrder defines the priority order for fallback
var providerOrder = []string{"gemini", "groq", "openai", "anthropic", "deepseek", "mistral", "cohere"}

// AIKeyEntry holds a provider name and its API key
type AIKeyEntry struct {
	Provider string
	Key      string
}

// getAIKeysFromDB reads all available AI keys from the database settings.
// It tries satker-specific key first (if satkerId provided), then falls back to global admin key.
func getAIKeysFromDB(db *gorm.DB, satkerId ...string) []AIKeyEntry {
	if db == nil {
		return nil
	}

	tryKeys := []string{}
	if len(satkerId) > 0 && satkerId[0] != "" {
		tryKeys = append(tryKeys, "ocr_api_keys_satker_"+satkerId[0])
	}
	tryKeys = append(tryKeys, "ocr_api_keys")

	for _, settingKey := range tryKeys {
		var setting struct {
			Value string
		}
		if err := db.Table("app_settings").Select("value").Where("key = ?", settingKey).First(&setting).Error; err != nil {
			continue
		}
		if setting.Value == "" {
			continue
		}
		var keysMap map[string]string
		if err := json.Unmarshal([]byte(setting.Value), &keysMap); err != nil {
			continue
		}
		var entries []AIKeyEntry
		for _, prov := range providerOrder {
			if key, ok := keysMap[prov]; ok && key != "" {
				entries = append(entries, AIKeyEntry{Provider: prov, Key: key})
			}
		}
		if len(entries) > 0 {
			return entries
		}
	}

	return nil
}

// callAIWithFallback tries each available AI provider in order until one succeeds.
// It accepts an optional requestedProvider to try first.
// db is used to fetch stored API keys from the database.
func callAIWithFallback(db *gorm.DB, requestedProvider, requestedKey, prompt string) (string, error) {
	// Build list of providers to try
	var providers []AIKeyEntry

	// If a specific provider+key was requested, try it first
	if requestedProvider != "" && requestedKey != "" {
		providers = append(providers, AIKeyEntry{Provider: requestedProvider, Key: requestedKey})
	}

	// Add DB-stored keys as fallback options
	if db != nil {
		dbKeys := getAIKeysFromDB(db)
		for _, dbKey := range dbKeys {
			// Avoid duplicating the explicitly requested provider
			if dbKey.Provider != requestedProvider {
				providers = append(providers, dbKey)
			}
		}
	}

	if len(providers) == 0 {
		return "", fmt.Errorf("tidak ada AI API key tersedia. Silakan atur di menu Pemindai Dokumen (AI) → Pengaturan Kunci API")
	}

	// Try each provider in order
	var lastErr error
	for _, p := range providers {
		log.Printf("[AI Fallback] Mencoba provider: %s", p.Provider)
		var result string
		var err error

		switch p.Provider {
		case "gemini":
			result, err = callGeminiAPI(p.Key, prompt)
		case "groq":
			result, err = callGroqAPI(p.Key, prompt)
		case "deepseek":
			result, err = callDeepSeekAPI(p.Key, prompt)
		case "openai":
			result, err = callOpenAIAPI(p.Key, prompt)
		case "cohere":
			result, err = callCohereAPI(p.Key, prompt)
		default:
			// Unknown provider, skip
			continue
		}

		if err == nil && result != "" {
			log.Printf("[AI Fallback] Berhasil dengan provider: %s", p.Provider)
			return result, nil
		}
		log.Printf("[AI Fallback] Provider %s gagal: %v", p.Provider, err)
		lastErr = err
	}

	return "", fmt.Errorf("semua AI provider gagal. Error terakhir: %v", lastErr)
}

// callDeepSeekAPI calls the DeepSeek Chat API (compatible with OpenAI format)
func callDeepSeekAPI(apiKey, prompt string) (string, error) {
	return callOpenAICompatibleAPI("https://api.deepseek.com/v1/chat/completions", "deepseek-chat", apiKey, prompt)
}

// callOpenAIAPI calls the OpenAI Chat Completions API
func callOpenAIAPI(apiKey, prompt string) (string, error) {
	return callOpenAICompatibleAPI("https://api.openai.com/v1/chat/completions", "gpt-4o-mini", apiKey, prompt)
}

// callCohereAPI calls Cohere's Command model
func callCohereAPI(apiKey, prompt string) (string, error) {
	return callOpenAICompatibleAPI("https://api.cohere.com/compatibility/v1/chat/completions", "command-r-plus", apiKey, prompt)
}
