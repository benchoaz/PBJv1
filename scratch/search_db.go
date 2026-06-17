package main

import (
	"database/sql"
	"fmt"
	"log"

	_ "github.com/lib/pq"
)

func main() {
	dbURL := "host=127.0.0.1 port=5432 user=postgres password=postgres dbname=pbj_db sslmode=disable"
	db, err := sql.Open("postgres", dbURL)
	if err != nil {
		log.Fatalf("Failed to open connection: %v", err)
	}
	defer db.Close()

	// Query public tables
	rows, err := db.Query(`
		SELECT table_name 
		FROM information_schema.tables 
		WHERE table_schema = 'public'
	`)
	if err != nil {
		log.Fatalf("Failed to query tables: %v", err)
	}
	defer rows.Close()

	var tables []string
	for rows.Next() {
		var name string
		if err := rows.Scan(&name); err == nil {
			tables = append(tables, name)
		}
	}

	fmt.Printf("Searching %d tables in PostgreSQL...\n", len(tables))

	for _, table := range tables {
		colRows, err := db.Query(fmt.Sprintf(`
			SELECT column_name 
			FROM information_schema.columns 
			WHERE table_name = '%s' AND (data_type LIKE '%%char%%' OR data_type = 'text')
		`, table))
		if err != nil {
			continue
		}
		
		var columns []string
		for colRows.Next() {
			var col string
			if err := colRows.Scan(&col); err == nil {
				columns = append(columns, col)
			}
		}
		colRows.Close()

		for _, col := range columns {
			var count int
			query := fmt.Sprintf("SELECT COUNT(*) FROM \"%s\" WHERE CAST(\"%s\" AS TEXT) LIKE '%%Jml Satker%%'", table, col)
			err := db.QueryRow(query).Scan(&count)
			if err != nil {
				continue
			}
			if count > 0 {
				fmt.Printf("FOUND in Table: '%s' | Column: '%s' | Count: %d\n", table, col, count)
				
				// Fetch some row snippet
				snippetQuery := fmt.Sprintf("SELECT id, substring(CAST(\"%s\" AS TEXT) from 1 for 200) FROM \"%s\" WHERE CAST(\"%s\" AS TEXT) LIKE '%%Jml Satker%%' LIMIT 1", col, table, col)
				var id int
				var snippet string
				if err := db.QueryRow(snippetQuery).Scan(&id, &snippet); err == nil {
					fmt.Printf("  ID: %d | Snippet: %s...\n", id, snippet)
				}
			}
		}
	}
}
