package handlers

import (
	"database/sql"
	"net/http"
	"net/http/httptest"
	"os"
	"path/filepath"
	"testing"

	_ "github.com/mattn/go-sqlite3"
)

func init() {
	// Create test template directory and file
	testTemplateDir := "test_templates"
	os.MkdirAll(testTemplateDir, 0755)
	templateContent := `<!DOCTYPE html><html><head><title>Chat</title></head><body><h1>Chat Page</h1></body></html>`
	os.WriteFile(filepath.Join(testTemplateDir, "chat.html"), []byte(templateContent), 0644)
}

func TestChatHandler(t *testing.T) {
	req, err := http.NewRequest("GET", "/chat", nil)
	if err != nil {
		t.Fatal(err)
	}

	rr := httptest.NewRecorder()
	handler := http.HandlerFunc(ChatHandler)

	// Create a session with a google_id
	session, _ := SessionStore.Get(req, "user-session")
	session.Values["google_id"] = "test-user-id"
	session.Save(req, rr)

	handler.ServeHTTP(rr, req)

	if status := rr.Code; status != http.StatusOK {
		t.Errorf("handler returned wrong status code: got %v want %v", status, http.StatusOK)
	}
}

func TestMessagesHandlerWithDB(t *testing.T) {
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

	req, err := http.NewRequest("GET", "/messages?receiver_id=receiver123", nil)
	if err != nil {
		t.Fatal(err)
	}

	rr := httptest.NewRecorder()
	handler := MessagesHandlerWithDB(db)

	// Create a session with a google_id
	session, _ := SessionStore.Get(req, "user-session")
	session.Values["google_id"] = "sender123"
	session.Save(req, rr)

	handler.ServeHTTP(rr, req)

	if status := rr.Code; status != http.StatusOK {
		t.Errorf("handler returned wrong status code: got %v want %v", status, http.StatusOK)
	}
}

func TestOnlineUsersHandler(t *testing.T) {
	req, err := http.NewRequest("GET", "/users", nil)
	if err != nil {
		t.Fatal(err)
	}

	rr := httptest.NewRecorder()
	handler := http.HandlerFunc(OnlineUsersHandler)

	// Create a session with a google_id
	session, _ := SessionStore.Get(req, "user-session")
	session.Values["google_id"] = "test-user-id"
	session.Save(req, rr)

	handler.ServeHTTP(rr, req)

	if status := rr.Code; status != http.StatusOK {
		t.Errorf("handler returned wrong status code: got %v want %v", status, http.StatusOK)
	}
} 