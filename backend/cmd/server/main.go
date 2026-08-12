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
		&models.Project{},
		&models.ProjectItem{},
		&models.ProjectItemSurvey{},
		&models.VendorLocation{},
		// Budget Integration (SIRUP-DPA-RKA)
		&models.RakDocument{},
		&models.BudgetAccount{},
		&models.DpaAccountSaved{},
		&models.DpaItemSaved{},
		&models.SirupPackageSaved{},
		&models.BudgetRealization{},
		&models.ProjectAddendum{},
		&models.BudgetCommitment{},
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

	projectRepo := repository.NewProjectRepository(sqlDB, gormDB)
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
	vendorLocationHandler := handlers.NewVendorLocationHandler(gormDB)
	reportHandler := handlers.NewReportHandler(gormDB)
	vendorReportHandler := handlers.NewVendorReportHandler(gormDB)
	sirupHandler := handlers.NewSirupHandler(gormDB)
	budgetHandler := handlers.NewBudgetHandler(gormDB)
	addendumHandler := handlers.NewAddendumHandler(gormDB)
	refineTextHandler := handlers.NewRefineTextHandler(gormDB)

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

	// Vendor Location Routes
	mux.HandleFunc("OPTIONS /api/vendor-locations", vendorLocationHandler.Options)
	mux.HandleFunc("GET /api/vendor-locations", vendorLocationHandler.GetAll)
	mux.HandleFunc("POST /api/vendor-locations", vendorLocationHandler.SetLocation)

	mux.HandleFunc("GET /api/projects", projectHandler.GetAll)
	mux.HandleFunc("GET /api/projects/{id}", projectHandler.GetByID)
	mux.HandleFunc("POST /api/projects", projectHandler.Create)
	mux.HandleFunc("PUT /api/projects/{id}", projectHandler.Update)
	mux.HandleFunc("DELETE /api/projects/{id}", projectHandler.Delete)
	mux.HandleFunc("POST /api/projects/{id}/finalize", projectHandler.Finalize)
	mux.HandleFunc("GET /api/projects/stats", projectHandler.Stats)
	
	// Reports Route
	mux.HandleFunc("GET /api/reports/absorption", reportHandler.GetAbsorptionReport)
	mux.HandleFunc("OPTIONS /api/reports/absorption", func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Access-Control-Allow-Origin", "*")
		w.Header().Set("Access-Control-Allow-Methods", "GET, OPTIONS")
		w.Header().Set("Access-Control-Allow-Headers", "Content-Type, X-User-Role, X-User-Satker")
		w.WriteHeader(http.StatusOK)
	})
	
	mux.HandleFunc("GET /api/reports/vendor-performance", vendorReportHandler.GetVendorPerformance)
	mux.HandleFunc("OPTIONS /api/reports/vendor-performance", func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Access-Control-Allow-Origin", "*")
		w.Header().Set("Access-Control-Allow-Methods", "GET, OPTIONS")
		w.Header().Set("Access-Control-Allow-Headers", "Content-Type, X-User-Role, X-User-Satker")
		w.WriteHeader(http.StatusOK)
	})
	
	// BAHP Routes
	mux.HandleFunc("POST /api/projects/{id}/bahp", bahpHandler.Create)
	mux.HandleFunc("GET /api/projects/{id}/bahp", bahpHandler.GetByProject)

	// Addendum Routes
	mux.HandleFunc("OPTIONS /api/projects/{id}/addendum", addendumHandler.Options)
	mux.HandleFunc("GET /api/projects/{id}/addendum", addendumHandler.GetAddendum)
	mux.HandleFunc("POST /api/projects/{id}/addendum", addendumHandler.SaveAddendum)
	mux.HandleFunc("OPTIONS /api/projects/{id}/addendum/verify", addendumHandler.Options)
	mux.HandleFunc("PUT /api/projects/{id}/addendum/verify", addendumHandler.VerifyAddendum)
	mux.HandleFunc("OPTIONS /api/projects/{id}/addendum/finalize", addendumHandler.Options)
	mux.HandleFunc("PUT /api/projects/{id}/addendum/finalize", addendumHandler.FinalizeAddendum)

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
	mux.HandleFunc("POST /api/pbj/upload-screenshot", handlers.UploadScreenshot)
	mux.HandleFunc("OPTIONS /api/pbj/upload-screenshot", pbjHandler.Options)

	// SIRUP LKPP live proxy endpoint
	mux.HandleFunc("GET /api/sirup/satker/{id}", sirupHandler.GetSirupPackages)
	mux.HandleFunc("POST /api/sirup/satker/{id}", sirupHandler.ImportSirupPackages)
	mux.HandleFunc("OPTIONS /api/sirup/satker/{id}", sirupHandler.Options)
	mux.HandleFunc("GET /api/sirup/package/{id}", sirupHandler.GetSirupPackageByID)
	mux.HandleFunc("OPTIONS /api/sirup/package/{id}", sirupHandler.Options)

	// ── Budget Integration: DPA saved to DB ──────────────────────────────────
	mux.HandleFunc("POST /api/dpa/accounts/save", budgetHandler.SaveDpaAccounts)
	mux.HandleFunc("GET /api/dpa/accounts", budgetHandler.GetDpaAccounts)
	mux.HandleFunc("OPTIONS /api/dpa/accounts", budgetHandler.Options)
	mux.HandleFunc("OPTIONS /api/dpa/accounts/save", budgetHandler.Options)

	// ── INAPROC Tax Assistant Calculator Route ───────────────────────────────
	mux.HandleFunc("GET /api/tax/calculate", budgetHandler.CalculateInaprocTax)
	mux.HandleFunc("OPTIONS /api/tax/calculate", budgetHandler.Options)

	// ── Budget Integration: SIRUP saved to DB ────────────────────────────────
	mux.HandleFunc("POST /api/sirup/save", budgetHandler.SaveSirupPackages)
	mux.HandleFunc("GET /api/sirup/saved", budgetHandler.GetSirupPackagesSaved)
	mux.HandleFunc("OPTIONS /api/sirup/save", budgetHandler.Options)
	mux.HandleFunc("OPTIONS /api/sirup/saved", budgetHandler.Options)

	// ── Budget Integration: RKA Anggaran Kas ─────────────────────────────────
	mux.HandleFunc("POST /api/rak/accounts", budgetHandler.SaveRakAccounts)
	mux.HandleFunc("GET /api/rak/accounts", budgetHandler.GetRakAccounts)
	mux.HandleFunc("POST /api/rak/parse-ai", budgetHandler.ParseRakAi)
	mux.HandleFunc("GET /api/rak/parse-status", budgetHandler.GetRakParseStatus)
	mux.HandleFunc("OPTIONS /api/rak/accounts", budgetHandler.Options)
	mux.HandleFunc("OPTIONS /api/rak/parse-ai", budgetHandler.Options)
	mux.HandleFunc("OPTIONS /api/rak/parse-status", budgetHandler.Options)

	// ── Budget Integration: Realization ──────────────────────────────────────
	mux.HandleFunc("POST /api/rak/realization", budgetHandler.SaveRealization)
	mux.HandleFunc("OPTIONS /api/rak/realization", budgetHandler.Options)

	// ── Budget Integration: Rekening Dashboard ───────────────────────────────
	mux.HandleFunc("GET /api/rekening/{kode}", budgetHandler.GetRekeningSummary)
	mux.HandleFunc("OPTIONS /api/rekening/{kode}", budgetHandler.Options)

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

	// AI Generic Text Refinement endpoint (with DB-based key fallback)
	mux.HandleFunc("POST /api/ai/refine-text", refineTextHandler.Handle)
	mux.HandleFunc("OPTIONS /api/ai/refine-text", func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Access-Control-Allow-Origin", "*")
		w.Header().Set("Access-Control-Allow-Methods", "POST, OPTIONS")
		w.Header().Set("Access-Control-Allow-Headers", "Content-Type, X-AI-Provider, X-AI-Key")
		w.WriteHeader(http.StatusOK)
	})

	// AI Generate Spec endpoint
	mux.HandleFunc("POST /api/ai/generate-spec", handlers.GenerateSpec)
	mux.HandleFunc("OPTIONS /api/ai/generate-spec", func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Access-Control-Allow-Origin", "*")
		w.Header().Set("Access-Control-Allow-Methods", "POST, OPTIONS")
		w.Header().Set("Access-Control-Allow-Headers", "Content-Type, X-AI-Provider, X-AI-Key")
		w.WriteHeader(http.StatusOK)
	})

	// Debug logs reader endpoint
	mux.HandleFunc("GET /api/debug-logs", func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Access-Control-Allow-Origin", "*")
		w.Header().Set("Content-Type", "text/plain")
		http.ServeFile(w, r, "./api_debug.log")
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