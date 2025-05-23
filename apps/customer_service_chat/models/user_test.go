package models

import (
	"database/sql"
	"testing"
	_ "github.com/mattn/go-sqlite3"
)

func TestSaveUser(t *testing.T) {
	db, err := sql.Open("sqlite3", ":memory:")
	if err != nil {
		t.Fatal(err)
	}
	defer db.Close()

	// Initialize the database schema
	_, err = db.Exec(`
	CREATE TABLE IF NOT EXISTS users (
		id INTEGER PRIMARY KEY AUTOINCREMENT,
		google_id TEXT UNIQUE NOT NULL,
		email TEXT UNIQUE NOT NULL,
		name TEXT NOT NULL,
		picture TEXT
	);`)
	if err != nil {
		t.Fatal(err)
	}

	// Test saving a user
	saved := SaveUser(db, "google123", "test@example.com", "Test User", "https://example.com/pic.jpg")
	if !saved {
		t.Errorf("SaveUser failed to save the user")
	}
}

func TestGetUserByGoogleID(t *testing.T) {
	db, err := sql.Open("sqlite3", ":memory:")
	if err != nil {
		t.Fatal(err)
	}
	defer db.Close()

	// Initialize the database schema
	_, err = db.Exec(`
	CREATE TABLE IF NOT EXISTS users (
		id INTEGER PRIMARY KEY AUTOINCREMENT,
		google_id TEXT UNIQUE NOT NULL,
		email TEXT UNIQUE NOT NULL,
		name TEXT NOT NULL,
		picture TEXT
	);`)
	if err != nil {
		t.Fatal(err)
	}

	// Insert a test user
	_, err = db.Exec("INSERT INTO users (google_id, email, name, picture) VALUES (?, ?, ?, ?)", "google123", "test@example.com", "Test User", "https://example.com/pic.jpg")
	if err != nil {
		t.Fatal(err)
	}

	// Test retrieving a user
	user, err := GetUserByGoogleID(db, "google123")
	if err != nil {
		t.Fatal(err)
	}
	if user.Email != "test@example.com" {
		t.Errorf("GetUserByGoogleID returned wrong email: got %v want %v", user.Email, "test@example.com")
	}
} 