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

	type Col struct {
		ColumnName string
		IsNullable string
	}
	var cols []Col
	db.Raw("SELECT column_name, is_nullable FROM information_schema.columns WHERE table_name = 'budget_accounts'").Scan(&cols)
	for _, c := range cols {
		if c.IsNullable == "NO" {
			fmt.Printf("%s: NOT NULL\n", c.ColumnName)
		}
	}
}
