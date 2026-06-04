package main

import (
	"log"
	"net/http"
	"os"

	"pbj/internal/handlers"
	"pbj/internal/models"
	"pbj/internal/repository"

	"gorm.io/driver/postgres"
	"gorm.io/gorm"
)

func main() {
	dbURL := os.Getenv("DATABASE_URL")
	if dbURL == "" {
		dbURL = "host=localhost port=5432 user=postgres password=postgres dbname=pbj sslmode=disable"
	}

	// GORM DB Connection
	gormDB, err := gorm.Open(postgres.Open(dbURL), &gorm.Config{})
	if err != nil {
		log.Fatalf("Failed to connect to database via GORM: %v", err)
	}

	sqlDB, err := gormDB.DB()
	if err != nil {
		log.Fatalf("Failed to get sql.DB from gorm: %v", err)
	}
	defer sqlDB.Close()

	if err := sqlDB.Ping(); err != nil {
		log.Fatalf("Failed to ping database: %v", err)
	}
	log.Println("Connected to PostgreSQL via GORM")

	// Auto Migrate
	err = gormDB.AutoMigrate(
		&models.User{},
		&models.Package{},
		&models.PackageItem{},
		&models.SurveyResult{},
		&models.AppSetting{},
		&models.Project{}, // Added Project here
	)
	if err != nil {
		log.Fatalf("Failed to auto-migrate models: %v", err)
	}

	// Seed default users if none exist
	var count int64
	gormDB.Model(&models.User{}).Count(&count)
	if count == 0 {
		defaultUsers := []models.User{
			{Name: "Handik Hariyanto, S.Kom., M.Si", Role: "PPK", NIP: "197909102002121004", Department: "Kecamatan Besuk", IdSatker: "67081", PerangkatDaerah: "Pemerintah Daerah Kabupaten Probolinggo", Password: "admin"},
			{Name: "Beni Trisna Wijaya, S.Kom", Role: "PP", NIP: "198205192010011010", Department: "Kecamatan Besuk", IdSatker: "67081", PerangkatDaerah: "Pemerintah Daerah Kabupaten Probolinggo", Password: "admin"},
			{Name: "Beni (Super Admin)", Role: "Admin", NIP: "admin", Department: "Unit Kerja Pengadaan Barang/Jasa (UKPBJ)", IdSatker: "308386", PerangkatDaerah: "Pemerintah Daerah Kabupaten Probolinggo", Password: "admin"},
		}
		for _, u := range defaultUsers {
			gormDB.Create(&u)
		}
	}

	// Fix PostgreSQL sequence for users table to prevent duplicate key errors after manual inserts
	gormDB.Exec("SELECT setval(pg_get_serial_sequence('users', 'id'), COALESCE(MAX(id), 1)) FROM users")

	projectRepo := repository.NewProjectRepository(sqlDB)
	bahpRepo := repository.NewBahpRepository(sqlDB)
	if err := bahpRepo.Initialize(); err != nil {
		log.Fatalf("Failed to initialize BAHP repository: %v", err)
	}

	projectHandler := handlers.NewProjectHandler(projectRepo)
	bahpHandler := handlers.NewBahpHandler(bahpRepo, projectRepo)
	authHandler := handlers.NewAuthHandler()
	pbjHandler := handlers.NewPBJHandler(gormDB)
	userHandler := handlers.NewUserHandler(gormDB)
	settingHandler := handlers.NewSettingHandler(gormDB)

	mux := http.NewServeMux()

	mux.HandleFunc("GET /health", func(w http.ResponseWriter, r *http.Request) {
		w.Write([]byte("OK"))
	})

	mux.HandleFunc("POST /api/auth/login", authHandler.Login)
	mux.HandleFunc("GET /api/auth/me", authHandler.Me)
	
	// User Routes
	mux.HandleFunc("OPTIONS /api/users", userHandler.Options)
	mux.HandleFunc("OPTIONS /api/users/{id}", userHandler.Options)
	mux.HandleFunc("GET /api/users", userHandler.GetAll)
	mux.HandleFunc("POST /api/users", userHandler.Create)
	mux.HandleFunc("PUT /api/users/{id}", userHandler.Update)
	mux.HandleFunc("DELETE /api/users/{id}", userHandler.Delete)

	// Setting Routes
	mux.HandleFunc("GET /api/settings/{key}", settingHandler.GetSetting)
	mux.HandleFunc("POST /api/settings", settingHandler.SetSetting)

	mux.HandleFunc("GET /api/projects", projectHandler.GetAll)
	mux.HandleFunc("GET /api/projects/{id}", projectHandler.GetByID)
	mux.HandleFunc("POST /api/projects", projectHandler.Create)
	mux.HandleFunc("PUT /api/projects/{id}", projectHandler.Update)
	mux.HandleFunc("DELETE /api/projects/{id}", projectHandler.Delete)
	mux.HandleFunc("GET /api/projects/stats", projectHandler.Stats)
	
	// BAHP Routes
	mux.HandleFunc("POST /api/projects/{id}/bahp", bahpHandler.Create)
	mux.HandleFunc("GET /api/projects/{id}/bahp", bahpHandler.GetByProject)

	// DPA Parser endpoints - proxy to Python PyMuPDF microservice
	mux.HandleFunc("POST /api/dpa/parse", handlers.ParseDPA)
	mux.HandleFunc("OPTIONS /api/dpa/parse", handlers.ParseDPAOptions)
	mux.HandleFunc("POST /api/dpa/align-rincian", handlers.AlignRincian)
	mux.HandleFunc("OPTIONS /api/dpa/align-rincian", handlers.AlignRincianOptions)
	mux.HandleFunc("GET /api/dpa/health", handlers.DpaHealthCheck)

	// PBJ / Package routes (GORM)
	mux.HandleFunc("POST /api/pbj/packages", pbjHandler.CreateOrUpdatePackage)
	mux.HandleFunc("OPTIONS /api/pbj/packages", pbjHandler.Options)
	mux.HandleFunc("PUT /api/pbj/packages/{id}/survey", pbjHandler.UpdateSurvey)
	mux.HandleFunc("OPTIONS /api/pbj/packages/{id}/survey", pbjHandler.Options)
	mux.HandleFunc("GET /api/pbj/packages/{id}", pbjHandler.GetPackage)

	// SIRUP LKPP live proxy endpoint
	mux.HandleFunc("GET /api/sirup/satker/{id}", handlers.GetSirupPackages)

	// AI Survey endpoint
	mux.HandleFunc("POST /api/survey/run", handlers.RunSurvey)
	mux.HandleFunc("OPTIONS /api/survey/run", handlers.RunSurveyOptions)

	// AI BAHP Refinement endpoint
	mux.HandleFunc("POST /api/ai/refine-bahp", handlers.RefineBahp)
	mux.HandleFunc("OPTIONS /api/ai/refine-bahp", func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Access-Control-Allow-Origin", "*")
		w.Header().Set("Access-Control-Allow-Methods", "POST, OPTIONS")
		w.Header().Set("Access-Control-Allow-Headers", "Content-Type, X-AI-Provider, X-AI-Key")
		w.WriteHeader(http.StatusOK)
	})

	// AI Exception Refinement endpoint
	mux.HandleFunc("POST /api/ai/refine-exception", handlers.RefineException)
	mux.HandleFunc("OPTIONS /api/ai/refine-exception", func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Access-Control-Allow-Origin", "*")
		w.Header().Set("Access-Control-Allow-Methods", "POST, OPTIONS")
		w.Header().Set("Access-Control-Allow-Headers", "Content-Type, X-AI-Provider, X-AI-Key")
		w.WriteHeader(http.StatusOK)
	})

	// AI Generic Text Refinement endpoint
	mux.HandleFunc("POST /api/ai/refine-text", handlers.RefineText)
	mux.HandleFunc("OPTIONS /api/ai/refine-text", func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Access-Control-Allow-Origin", "*")
		w.Header().Set("Access-Control-Allow-Methods", "POST, OPTIONS")
		w.Header().Set("Access-Control-Allow-Headers", "Content-Type, X-AI-Provider, X-AI-Key")
		w.WriteHeader(http.StatusOK)
	})

	addr := ":8080"
	if port := os.Getenv("PORT"); port != "" {
		addr = ":" + port
	}

	log.Printf("Server starting on %s", addr)
	if err := http.ListenAndServe(addr, mux); err != nil {
		log.Fatalf("Server failed: %v", err)
	}
}