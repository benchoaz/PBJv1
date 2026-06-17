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

	result := db.Exec("ALTER TABLE budget_accounts DROP COLUMN IF EXISTS rka_document_id CASCADE;")
	if result.Error != nil {
		log.Fatal(result.Error)
	}
	fmt.Println("Dropped column rka_document_id")
}
