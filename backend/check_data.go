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

	var c int64
	db.Table("rak_documents").Count(&c)
	fmt.Println("Docs:", c)

	db.Table("budget_accounts").Count(&c)
	fmt.Println("Accounts:", c)
}
