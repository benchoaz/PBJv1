package main

import (
	"fmt"
	"log"
	"os"

	"pbj/internal/models"
	"gorm.io/driver/postgres"
	"gorm.io/gorm"
)

func main() {
	dbURL := os.Getenv("DATABASE_URL")
	if dbURL == "" {
		dbURL = "host=127.0.0.1 port=5432 user=postgres password=postgres dbname=pbj_db sslmode=disable"
	}
	db, err := gorm.Open(postgres.Open(dbURL), &gorm.Config{})
	if err != nil {
		log.Fatalf("Failed to connect: %v", err)
	}

	var count int64
	db.Model(&models.Package{}).Count(&count)
	fmt.Printf("Number of Packages: %d\n", count)
}
