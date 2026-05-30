package config

import (
	"os"
	"testing"
)

func TestLoadDefaults(t *testing.T) {
	os.Clearenv()

	cfg := Load()

	if cfg.DBHost != "localhost" {
		t.Errorf("Expected DBHost to be 'localhost', got '%s'", cfg.DBHost)
	}
	if cfg.DBPort != "5432" {
		t.Errorf("Expected DBPort to be '5432', got '%s'", cfg.DBPort)
	}
	if cfg.Port != "8080" {
		t.Errorf("Expected Port to be '8080', got '%s'", cfg.Port)
	}
}

func TestLoadFromEnv(t *testing.T) {
	os.Setenv("DB_HOST", "testhost")
	os.Setenv("DB_PORT", "5433")
	os.Setenv("PORT", "9000")
	defer os.Clearenv()

	cfg := Load()

	if cfg.DBHost != "testhost" {
		t.Errorf("Expected DBHost to be 'testhost', got '%s'", cfg.DBHost)
	}
	if cfg.DBPort != "5433" {
		t.Errorf("Expected DBPort to be '5433', got '%s'", cfg.DBPort)
	}
	if cfg.Port != "9000" {
		t.Errorf("Expected Port to be '9000', got '%s'", cfg.Port)
	}
}

func TestIsDev(t *testing.T) {
	cfg := &Config{Env: "development"}
	if !cfg.IsDev() {
		t.Error("Expected IsDev to return true for 'development'")
	}

	cfg.Env = "production"
	if cfg.IsDev() {
		t.Error("Expected IsDev to return false for 'production'")
	}
}