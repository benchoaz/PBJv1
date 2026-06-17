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
		DataType string
		CharacterMaximumLength *int
	}
	var col Col
	db.Raw("SELECT data_type, character_maximum_length FROM information_schema.columns WHERE table_name = 'budget_accounts' AND column_name = 'sub_kegiatan'").Scan(&col)
	
	if col.CharacterMaximumLength != nil {
		fmt.Printf("Type: %s, Max: %d\n", col.DataType, *col.CharacterMaximumLength)
	} else {
		fmt.Printf("Type: %s, Max: null\n", col.DataType)
	}
}
