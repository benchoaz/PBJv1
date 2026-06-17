package main

import (
	"fmt"
	"gorm.io/driver/postgres"
	"gorm.io/gorm"
	"log"
	"os"
	"pbj/internal/models"
)

func main() {
	dbURL := os.Getenv("DATABASE_URL")
	db, err := gorm.Open(postgres.Open(dbURL), &gorm.Config{})
	if err != nil {
		log.Fatal(err)
	}

	var accounts []models.BudgetAccount
	db.Find(&accounts)

	fmt.Printf("Total BudgetAccounts: %d\n", len(accounts))
	for _, acc := range accounts {
		fmt.Printf("ID: %d, Rek: %s, SubKeg: '%s', Jan: %f, CreatedAt: %s, UpdatedAt: %s\n", 
			acc.ID, acc.KodeRekening, acc.SubKegiatan, acc.BulanJan, acc.CreatedAt.Format("15:04:05"), acc.UpdatedAt.Format("15:04:05"))
	}
}
