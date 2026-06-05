package repository

import (
	"database/sql"
	"log"
	"os"
	"testing"

	_ "github.com/lib/pq"
	"gorm.io/driver/postgres"
	"gorm.io/gorm"
)

var testDB *sql.DB
var testGormDB *gorm.DB

func setupTestDB(t *testing.T) (*sql.DB, *gorm.DB, func()) {
	if testDB != nil {
		cleanTables(testDB)
		return testDB, testGormDB, func() {}
	}

	db, err := sql.Open("postgres", "host=localhost port=5432 user=postgres password=postgres dbname=pbj_test sslmode=disable")
	if err != nil {
		t.Skipf("Skipping test: cannot connect to test database: %v", err)
		return nil, nil, func() {}
	}

	if err := db.Ping(); err != nil {
		t.Skipf("Skipping test: cannot ping test database: %v", err)
		db.Close()
		return nil, nil, func() {}
	}
	testDB = db

	db.Exec("DROP TABLE IF EXISTS projects CASCADE")

	createTableSQL := `CREATE TABLE projects (
		id SERIAL PRIMARY KEY,
		name VARCHAR(255) NOT NULL,
		description TEXT,
		budget DECIMAL(15,2),
		ministry VARCHAR(255),
		province VARCHAR(100),
		source_url VARCHAR(500),
		status VARCHAR(50) DEFAULT 'baru',
		start_date TIMESTAMP,
		end_date TIMESTAMP,
		created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
		updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
	)`

	if _, err := testDB.Exec(createTableSQL); err != nil {
		t.Fatalf("Failed to create test table: %v", err)
	}

	dialector := postgres.New(postgres.Config{
		Conn: testDB,
	})
	gormDB, err := gorm.Open(dialector, &gorm.Config{})
	if err != nil {
		t.Fatalf("Failed to open GORM: %v", err)
	}
	testGormDB = gormDB

	logger := log.New(os.Stdout, "[TEST] ", log.LstdFlags)
	_ = logger

	return testDB, testGormDB, func() {
		cleanTables(testDB)
	}
}


func cleanTables(db *sql.DB) {
	db.Exec("TRUNCATE TABLE projects CASCADE")
}

func TestMain(m *testing.M) {
	exitCode := m.Run()

	if testDB != nil {
		testDB.Exec("DROP TABLE IF EXISTS projects CASCADE")
		testDB.Close()
	}

	os.Exit(exitCode)
}