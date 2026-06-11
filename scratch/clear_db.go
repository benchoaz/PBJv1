package main

import (
	"log"

	"gorm.io/driver/postgres"
	"gorm.io/gorm"
)

func main() {
	dsn := "host=localhost user=postgres password=password dbname=pbjsystem port=5432 sslmode=disable TimeZone=Asia/Jakarta"
	db, err := gorm.Open(postgres.Open(dsn), &gorm.Config{})
	if err != nil {
		log.Fatal("failed to connect database")
	}

	result := db.Exec("DELETE FROM budget_accounts;")
	if result.Error != nil {
		log.Fatal(result.Error)
	}
	log.Println("Successfully deleted all budget_accounts")
}
