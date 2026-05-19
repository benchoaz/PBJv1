package main

import (
	"database/sql"
	"log"
	"net/http"
	"os"

	"pbj/internal/handlers"
	"pbj/internal/repository"

	_ "github.com/lib/pq"
)

func main() {
	dbURL := os.Getenv("DATABASE_URL")
	if dbURL == "" {
		dbURL = "host=localhost port=5432 user=postgres password=postgres dbname=pbj sslmode=disable"
	}

	db, err := sql.Open("postgres", dbURL)
	if err != nil {
		log.Fatalf("Failed to connect to database: %v", err)
	}
	defer db.Close()

	if err := db.Ping(); err != nil {
		log.Fatalf("Failed to ping database: %v", err)
	}
	log.Println("Connected to PostgreSQL")

	projectRepo := repository.NewProjectRepository(db)

	projectHandler := handlers.NewProjectHandler(projectRepo)
	authHandler := handlers.NewAuthHandler()

	mux := http.NewServeMux()

	mux.HandleFunc("GET /health", func(w http.ResponseWriter, r *http.Request) {
		w.Write([]byte("OK"))
	})

	mux.HandleFunc("POST /api/auth/login", authHandler.Login)
	mux.HandleFunc("GET /api/auth/me", authHandler.Me)
	mux.HandleFunc("GET /api/projects", projectHandler.GetAll)
	mux.HandleFunc("GET /api/projects/{id}", projectHandler.GetByID)
	mux.HandleFunc("POST /api/projects", projectHandler.Create)
	mux.HandleFunc("PUT /api/projects/{id}", projectHandler.Update)
	mux.HandleFunc("DELETE /api/projects/{id}", projectHandler.Delete)
	mux.HandleFunc("GET /api/projects/stats", projectHandler.Stats)

	// DPA Parser endpoints - proxy to Python PyMuPDF microservice
	mux.HandleFunc("POST /api/dpa/parse", handlers.ParseDPA)
	mux.HandleFunc("OPTIONS /api/dpa/parse", handlers.ParseDPAOptions)
	mux.HandleFunc("POST /api/dpa/align-rincian", handlers.AlignRincian)
	mux.HandleFunc("OPTIONS /api/dpa/align-rincian", handlers.AlignRincianOptions)
	mux.HandleFunc("GET /api/dpa/health", handlers.DpaHealthCheck)

	// SIRUP LKPP live proxy endpoint
	mux.HandleFunc("GET /api/sirup/satker/{id}", handlers.GetSirupPackages)

	addr := ":8080"
	if port := os.Getenv("PORT"); port != "" {
		addr = ":" + port
	}

	log.Printf("Server starting on %s", addr)
	if err := http.ListenAndServe(addr, mux); err != nil {
		log.Fatalf("Server failed: %v", err)
	}
}