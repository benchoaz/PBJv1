package main

import (
	"fmt"
	"log"

	"gorm.io/driver/postgres"
	"gorm.io/gorm"
	"gorm.io/gorm/clause"
	"pbj/internal/models"
)

func main() {
	dsn := "host=127.0.0.1 port=5432 user=postgres password=pbj_secure_prod_pwd dbname=pbj_db sslmode=disable"
	db, err := gorm.Open(postgres.Open(dsn), &gorm.Config{})
	if err != nil {
		log.Fatal(err)
	}

	acc := models.BudgetAccount{
		RakDocumentID: 1,
		SatkerID: "67081",
		TahunAnggaran: 2026,
		KodeRekening: "12345",
		SubKegiatan: "Test",
		BulanJan: 1000,
	}

	err = db.Clauses(clause.OnConflict{
		Columns:   []clause.Column{{Name: "satker_id"}, {Name: "tahun_anggaran"}, {Name: "kode_rekening"}},
		DoUpdates: clause.AssignmentColumns([]string{
			"rak_document_id", "uraian", "anggaran_tahun", "total_rak",
			"program", "kegiatan", 
			"bulan_jan", "bulan_feb", "bulan_mar", "bulan_apr", "bulan_mei", "bulan_jun",
			"bulan_jul", "bulan_ags", "bulan_sep", "bulan_okt", "bulan_nov", "bulan_des",
			"updated_at",
		}),
	}).Create(&acc).Error

	fmt.Printf("Error: %v\n", err)
}
