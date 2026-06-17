package main

import (
	"fmt"
	"gorm.io/driver/postgres"
	"gorm.io/gorm"
)

type BudgetAccount struct {
	ID           uint64 `gorm:"primaryKey"`
	KodeRekening string
	Program      string
	Kegiatan     string
	SubKegiatan  string
}

func main() {
	dsn := "host=localhost user=postgres password=postgres dbname=pbj_db port=5432 sslmode=disable"
	db, err := gorm.Open(postgres.Open(dsn), &gorm.Config{})
	if err != nil {
		fmt.Println("Error connecting to database:", err)
		return
	}

	var accounts []BudgetAccount
	db.Find(&accounts)
	fmt.Println("BEFORE:")
	for _, a := range accounts {
		fmt.Printf("%d | %s | %s | %s | %s\n", a.ID, a.KodeRekening, a.Program, a.Kegiatan, a.SubKegiatan)
	}

	db.Where("kode_rekening = ?", "12345").Delete(&BudgetAccount{})
	db.Where("program = ?", "Test").Delete(&BudgetAccount{})
	
	db.Find(&accounts)
	fmt.Println("AFTER:")
	for _, a := range accounts {
		fmt.Printf("%d | %s | %s | %s | %s\n", a.ID, a.KodeRekening, a.Program, a.Kegiatan, a.SubKegiatan)
	}
}
