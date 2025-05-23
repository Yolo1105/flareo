package handlers

import (
	"database/sql"
	"encoding/json"
	"mychat/models"
	"net/http"
	"os"
)

// ChatHandler serves the chat page.
func ChatHandler(w http.ResponseWriter, r *http.Request) {
	session, _ := SessionStore.Get(r, "user-session")
	if session.Values["google_id"] == nil {
		http.Redirect(w, r, "/login", http.StatusTemporaryRedirect)
		return
	}

	// Use test template directory if it exists
	templatePath := "templates/chat.html"
	if _, err := os.Stat("test_templates/chat.html"); err == nil {
		templatePath = "test_templates/chat.html"
	}
	http.ServeFile(w, r, templatePath)
}

// MessagesHandler retrieves messages between two users.
func MessagesHandlerWithDB(db *sql.DB) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		session, _ := SessionStore.Get(r, "user-session")
		if session.Values["google_id"] == nil {
			http.Error(w, "Unauthorized", http.StatusUnauthorized)
			return
		}

		senderID := session.Values["google_id"].(string)
		receiverID := r.URL.Query().Get("receiver_id")

		messages, err := models.GetMessages(db, senderID, receiverID)
		if err != nil {
			http.Error(w, "Failed to retrieve messages", http.StatusInternalServerError)
			return
		}

		w.Header().Set("Content-Type", "application/json")
		json.NewEncoder(w).Encode(messages)
	}
}

// OnlineUsersHandler retrieves a list of online users.
func OnlineUsersHandler(w http.ResponseWriter, r *http.Request) {
	session, _ := SessionStore.Get(r, "user-session")
	if session.Values["google_id"] == nil {
		http.Error(w, "Unauthorized", http.StatusUnauthorized)
		return
	}

	// Example: Return a list of online users (simplified)
	onlineUsers := []map[string]interface{}{
		{"id": "user1", "name": "User 1", "picture": "https://example.com/pic1.jpg"},
		{"id": "user2", "name": "User 2", "picture": "https://example.com/pic2.jpg"},
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(onlineUsers)
}

// IndexHandler serves the home page.
func IndexHandler(w http.ResponseWriter, r *http.Request) {
	w.WriteHeader(http.StatusOK)
	w.Write([]byte("<html><body><h1>Welcome to Customer Service Chat!</h1><a href='/chat'>Go to Chat</a></body></html>"))
}

// LoginPageHandler serves the login page.
func LoginPageHandler(w http.ResponseWriter, r *http.Request) {
	w.WriteHeader(http.StatusOK)
	w.Write([]byte("<html><body><h1>Login</h1><a href='/auth/google'>Login with Google</a></body></html>"))
}
