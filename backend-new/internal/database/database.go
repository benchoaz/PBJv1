package database

import (
	"fmt"
	"log"
	"os"

	"pbj/internal/config"
)

type DB struct {
	Host     string
	Port     string
	User     string
	Password string
	DBName   string
}

func NewDB(cfg *config.Config) *DB {
	return &DB{
		Host:     cfg.DBHost,
		Port:     cfg.DBPort,
		User:     cfg.DBUser,
		Password: cfg.DBPassword,
		DBName:   cfg.DBName,
	}
}

func (db *DB) ConnectionString() string {
	return fmt.Sprintf("host=%s port=%s user=%s password=%s dbname=%s sslmode=disable",
		db.Host, db.Port, db.User, db.Password, db.DBName)
}

func (db *DB) GetSchemaPath() string {
	path := "schema.sql"
	if _, err := os.Stat(path); err == nil {
		return path
	}
	return ""
}

func InitSchema(db *DB) error {
	schemaPath := db.GetSchemaPath()
	if schemaPath == "" {
		log.Println("No schema.sql found, skipping schema initialization")
		return nil
	}

	schema, err := os.ReadFile(schemaPath)
	if err != nil {
		return fmt.Errorf("failed to read schema file: %w", err)
	}

	log.Println("Schema file found. Run migrations manually using:")
	log.Printf("  psql %s < %s\n", db.ConnectionString(), schemaPath)
	return nil
}