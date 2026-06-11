package main

import (
	"log"

	"gorm.io/driver/postgres"
	"gorm.io/gorm"
)

func main() {
	dsn := "host=127.0.0.1 user=postgres password=pbj_secure_prod_pwd dbname=pbj_db port=5432 sslmode=disable TimeZone=Asia/Jakarta"
	db, err := gorm.Open(postgres.Open(dsn), &gorm.Config{})
	if err != nil {
		log.Fatal("failed to connect database")
	}

	result := db.Exec("TRUNCATE budget_accounts CASCADE;")
	if result.Error != nil {
		log.Fatal(result.Error)
	}
	log.Println("Successfully TRUNCATED budget_accounts CASCADE")
}
