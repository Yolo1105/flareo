package main

import (
	"database/sql"
	"log"
	"net/http"
	"os"

	"mychat/handlers"
	"mychat/models"
	"mychat/websocket"

	"github.com/joho/godotenv"
	_ "github.com/mattn/go-sqlite3"
)

var (
	db        *sql.DB
	wsManager *websocket.Manager
)

func init() {
	if err := godotenv.Load(); err != nil {
		log.Println("No .env file found, using environment variables.")
	}
}

func main() {
	db = models.InitDB()
	defer db.Close()

	wsManager = websocket.NewManager()
	go wsManager.Run()

	handlers.LoadOAuthConfig()

	http.Handle("/static/", http.StripPrefix("/static/", http.FileServer(http.Dir("static"))))

	http.HandleFunc("/", handlers.IndexHandler)
	http.HandleFunc("/login", handlers.LoginPageHandler)
	// http.HandleFunc("/register", handlers.RegisterPageHandler)
	// http.HandleFunc("/logout", handlers.LogoutHandler)
	http.HandleFunc("/chat", handlers.ChatHandler)
	http.HandleFunc("/ws", func(w http.ResponseWriter, r *http.Request) {
		// session, _ := handlers.SessionStore.Get(r, "user-session")
		// if session.Values["google_id"] == nil {
		// 	http.Error(w, "Unauthorized", http.StatusUnauthorized)
		// 	return
		// }
		// wsManager.HandleWebSocket(w, r, session.Values["google_id"].(string), session.Values)
	})
	http.HandleFunc("/messages", handlers.MessagesHandlerWithDB(db))
	http.HandleFunc("/users", handlers.OnlineUsersHandler)
	http.HandleFunc("/auth/google", handlers.GoogleLoginHandler)
	http.HandleFunc("/auth/google/callback", handlers.GoogleCallbackHandler)
	// http.HandleFunc("/register-manual", handlers.ManualRegisterHandler)

	port := os.Getenv("PORT")
	if port == "" {
		port = "8080"
	}
	log.Printf("Server starting on port %s", port)
	log.Fatal(http.ListenAndServe(":"+port, nil))
}
