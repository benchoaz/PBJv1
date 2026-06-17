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
	gormDB, err := gorm.Open(postgres.Open(dbURL), &gorm.Config{})
	if err != nil {
		log.Fatal(err)
	}

	var accounts []models.BudgetAccount
	gormDB.Find(&accounts)

	fmt.Printf("Total BudgetAccounts: %d\n", len(accounts))
	for _, acc := range accounts {
		fmt.Printf("ID: %d, Rek: %s, SubKeg: '%s', Jan: %f\n", acc.ID, acc.KodeRekening, acc.SubKegiatan, acc.BulanJan)
	}
}
