package repository

import (
	"database/sql"
	"embed"
	"log"
	"os"
	"path/filepath"
	"sort"

	_ "modernc.org/sqlite"
)

var DB *sql.DB

// migrationsFSHolder holds the embedded migrations FS
var migrationsFSHolder *embed.FS

// InitMigrationsFS sets the embedded migrations filesystem
func InitMigrationsFS(fs embed.FS) {
	migrationsFSHolder = &fs
}

func InitDB(dbPath string) error {
	var err error
	DB, err = sql.Open("sqlite", dbPath)
	if err != nil {
		return err
	}

	if err = DB.Ping(); err != nil {
		return err
	}

	if err = runMigrations(); err != nil {
		return err
	}

	log.Println("Database initialized successfully")
	return nil
}

func runMigrations() error {
	// Try to find migrations directory relative to executable
	ex, err := os.Executable()
	dir := "."
	if err == nil {
		dir = filepath.Dir(ex)
	}

	migrationsDir := filepath.Join(dir, "migrations")
	if _, err := os.Stat(migrationsDir); os.IsNotExist(err) {
		// Try current working directory
		migrationsDir = "migrations"
		if _, err := os.Stat(migrationsDir); os.IsNotExist(err) {
			// Use embedded migrations
			return runEmbeddedMigrations()
		}
	}

	entries, err := os.ReadDir(migrationsDir)
	if err != nil {
		// Fallback to embedded
		return runEmbeddedMigrations()
	}

	var files []string
	for _, e := range entries {
		if !e.IsDir() && filepath.Ext(e.Name()) == ".sql" {
			files = append(files, e.Name())
		}
	}
	sort.Strings(files)

	if len(files) == 0 {
		return runEmbeddedMigrations()
	}

	for _, f := range files {
		data, err := os.ReadFile(filepath.Join(migrationsDir, f))
		if err != nil {
			return err
		}
		if _, err := DB.Exec(string(data)); err != nil {
			log.Printf("Warning: migration %s failed (may already be applied): %v", f, err)
		} else {
			log.Printf("Applied migration: %s", f)
		}
	}

	return nil
}

func runEmbeddedMigrations() error {
	if migrationsFSHolder == nil {
		return nil
	}

	fs := *migrationsFSHolder
	entries, err := fs.ReadDir("migrations")
	if err != nil {
		return err
	}

	var files []string
	for _, e := range entries {
		if !e.IsDir() && filepath.Ext(e.Name()) == ".sql" {
			files = append(files, e.Name())
		}
	}
	sort.Strings(files)

	// Extract to temp directory
	ex, err := os.Executable()
	dir := "."
	if err == nil {
		dir = filepath.Dir(ex)
	}

	tempDir := filepath.Join(dir, "labasset-migrations")
	os.RemoveAll(tempDir)
	if err := os.MkdirAll(tempDir, 0755); err != nil {
		return err
	}

	// Extract embedded migrations to temp
	for _, f := range files {
		data, err := fs.ReadFile(filepath.Join("migrations", f))
		if err != nil {
			return err
		}
		if err := os.WriteFile(filepath.Join(tempDir, f), data, 0644); err != nil {
			return err
		}
	}

	// Now execute from temp directory
	for _, f := range files {
		data, err := os.ReadFile(filepath.Join(tempDir, f))
		if err != nil {
			return err
		}
		if _, err := DB.Exec(string(data)); err != nil {
			log.Printf("Warning: migration %s failed (may already be applied): %v", f, err)
		} else {
			log.Printf("Applied migration: %s", f)
		}
	}

	return nil
}

func CloseDB() {
	if DB != nil {
		DB.Close()
	}
}
