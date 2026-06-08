package main

import (
	"encoding/json"
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

	var p models.Project
	db.Preload("Items").First(&p, 31)

	fmt.Printf("=== Project 31 Details ===\n")
	fmt.Printf("ID: %d\n", p.ID)
	fmt.Printf("Name: %s\n", p.Name)
	fmt.Printf("Status: %s\n", p.Status)
	fmt.Printf("Description: %s\n", p.Description)
	fmt.Printf("Number of Items: %d\n", len(p.Items))
	for i, item := range p.Items {
		itemBytes, _ := json.Marshal(item)
		fmt.Printf("Item %d: %s\n", i+1, string(itemBytes))
	}
}
