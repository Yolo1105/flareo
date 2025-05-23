package models

import (
	"database/sql"
	"log"
)

type User struct {
	ID       int
	GoogleID string
	Email    string
	Name     string
	Picture  string
}

// SaveUser saves a user to the database.
func SaveUser(db *sql.DB, googleID, email, name, picture string) bool {
	query := `INSERT INTO users (google_id, email, name, picture) VALUES (?, ?, ?, ?)`
	_, err := db.Exec(query, googleID, email, name, picture)
	if err != nil {
		log.Printf("Error saving user: %v", err)
		return false
	}
	return true
}

// GetUserByGoogleID retrieves a user by their Google ID.
func GetUserByGoogleID(db *sql.DB, googleID string) (*User, error) {
	query := `SELECT id, google_id, email, name, picture FROM users WHERE google_id = ?`
	user := &User{}
	err := db.QueryRow(query, googleID).Scan(&user.ID, &user.GoogleID, &user.Email, &user.Name, &user.Picture)
	if err != nil {
		return nil, err
	}
	return user, nil
} 