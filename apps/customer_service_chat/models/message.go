package models

import (
	"database/sql"
	"log"
)

type Message struct {
	ID         int
	SenderID   string
	ReceiverID string
	Content    string
	Timestamp  string
	Status     string
}

// SaveMessage saves a message to the database.
func SaveMessage(db *sql.DB, senderID, receiverID, content, status string) bool {
	query := `INSERT INTO messages (sender_id, receiver_id, content, status) VALUES (?, ?, ?, ?)`
	_, err := db.Exec(query, senderID, receiverID, content, status)
	if err != nil {
		log.Printf("Error saving message: %v", err)
		return false
	}
	return true
}

// GetMessages retrieves messages between two users.
func GetMessages(db *sql.DB, senderID, receiverID string) ([]Message, error) {
	query := `SELECT id, sender_id, receiver_id, content, timestamp, status FROM messages WHERE (sender_id = ? AND receiver_id = ?) OR (sender_id = ? AND receiver_id = ?) ORDER BY timestamp ASC`
	rows, err := db.Query(query, senderID, receiverID, receiverID, senderID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var messages []Message
	for rows.Next() {
		var msg Message
		if err := rows.Scan(&msg.ID, &msg.SenderID, &msg.ReceiverID, &msg.Content, &msg.Timestamp, &msg.Status); err != nil {
			return nil, err
		}
		messages = append(messages, msg)
	}
	return messages, nil
} 