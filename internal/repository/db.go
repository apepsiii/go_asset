package repository

import (
	"database/sql"
	"log"
	"os"
	"path/filepath"

	_ "modernc.org/sqlite"
)

var DB *sql.DB

func InitDB(dbPath string) error {
	var err error
	DB, err = sql.Open("sqlite", dbPath)
	if err != nil {
		return err
	}

	if err = DB.Ping(); err != nil {
		return err
	}

	if err = runMigrations(dbPath); err != nil {
		return err
	}

	log.Println("Database initialized successfully")
	return nil
}

func runMigrations(dbPath string) error {
	ex, err := os.Executable()
	if err != nil {
		return err
	}
	dir := filepath.Dir(ex)
	if dir == "" {
		dir = "."
	}

	migrationPath := filepath.Join(dir, "migrations", "000001_init_schema.up.sql")
	if _, err := os.Stat(migrationPath); os.IsNotExist(err) {
		migrationPath = filepath.Join(".", "migrations", "000001_init_schema.up.sql")
	}

	data, err := os.ReadFile(migrationPath)
	if err != nil {
		return err
	}

	_, err = DB.Exec(string(data))
	return err
}

func CloseDB() {
	if DB != nil {
		DB.Close()
	}
}
