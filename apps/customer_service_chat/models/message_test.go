package models

import (
	"database/sql"
	"testing"
	_ "github.com/mattn/go-sqlite3"
)

func TestSaveMessage(t *testing.T) {
	db, err := sql.Open("sqlite3", ":memory:")
	if err != nil {
		t.Fatal(err)
	}
	defer db.Close()

	// Initialize the database schema
	_, err = db.Exec(`
	CREATE TABLE IF NOT EXISTS messages (
		id INTEGER PRIMARY KEY AUTOINCREMENT,
		sender_id TEXT NOT NULL,
		receiver_id TEXT NOT NULL,
		content TEXT NOT NULL,
		timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
		status TEXT DEFAULT 'sent'
	);`)
	if err != nil {
		t.Fatal(err)
	}

	// Test saving a message
	saved := SaveMessage(db, "sender123", "receiver123", "Hello, World!", "sent")
	if !saved {
		t.Errorf("SaveMessage failed to save the message")
	}
}

func TestGetMessages(t *testing.T) {
	db, err := sql.Open("sqlite3", ":memory:")
	if err != nil {
		t.Fatal(err)
	}
	defer db.Close()

	// Initialize the database schema
	_, err = db.Exec(`
	CREATE TABLE IF NOT EXISTS messages (
		id INTEGER PRIMARY KEY AUTOINCREMENT,
		sender_id TEXT NOT NULL,
		receiver_id TEXT NOT NULL,
		content TEXT NOT NULL,
		timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
		status TEXT DEFAULT 'sent'
	);`)
	if err != nil {
		t.Fatal(err)
	}

	// Insert a test message
	_, err = db.Exec("INSERT INTO messages (sender_id, receiver_id, content, status) VALUES (?, ?, ?, ?)", "sender123", "receiver123", "Hello, World!", "sent")
	if err != nil {
		t.Fatal(err)
	}

	// Test retrieving messages
	messages, err := GetMessages(db, "sender123", "receiver123")
	if err != nil {
		t.Fatal(err)
	}
	if len(messages) != 1 {
		t.Errorf("GetMessages returned %d messages, expected 1", len(messages))
	}
} 