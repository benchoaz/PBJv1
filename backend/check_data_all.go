package main

import (
	"fmt"
	"log"

	"gorm.io/driver/postgres"
	"gorm.io/gorm"
)

func main() {
	dsn := "host=127.0.0.1 port=5432 user=postgres password=pbj_secure_prod_pwd dbname=pbj_db sslmode=disable"
	db, err := gorm.Open(postgres.Open(dsn), &gorm.Config{})
	if err != nil {
		log.Fatal(err)
	}

	type BudgetAccount struct {
		ID int
		KodeRekening string
		SubKegiatan string
		SatkerID string
		BulanJan float64
		Updatedat string `gorm:"column:updated_at"`
	}
	var accounts []BudgetAccount
	db.Find(&accounts)
	fmt.Printf("Total: %d\n", len(accounts))
	for _, a := range accounts {
		fmt.Printf("ID: %d, Kode: %s, SubKegiatan: %s, Jan: %v, Updated: %s\n", a.ID, a.KodeRekening, a.SubKegiatan, a.BulanJan, a.Updatedat)
	}
}
