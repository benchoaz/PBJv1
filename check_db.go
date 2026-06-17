package main

import (
	"fmt"
	"log"

	"gorm.io/driver/sqlite"
	"gorm.io/gorm"
)

func main() {
	db, err := gorm.Open(sqlite.Open("backend/pbj.db"), &gorm.Config{})
	if err != nil {
		log.Fatal(err)
	}

	var count int64
	db.Table("budget_accounts").Count(&count)
	fmt.Printf("budget_accounts count: %d\n", count)
}
