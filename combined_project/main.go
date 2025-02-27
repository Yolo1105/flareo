package main
import layout "combined_project/internal/layout"

import (
	"database/sql"
	"html/template"
	"log"
	"net/http"
	"os"
	"sync"
	"time"

	"github.com/gorilla/sessions"
	"github.com/gorilla/websocket"
	"github.com/joho/godotenv"
	_ "github.com/mattn/go-sqlite3"

	"github.com/labstack/echo/v4"
	"github.com/labstack/echo/v4/middleware"
)

var (
	store       = sessions.NewCookieStore([]byte("super-secret-key"))
	upgrader    = websocket.Upgrader{}
	connections = make(map[*websocket.Conn]bool)
	mu          sync.Mutex
	db          *sql.DB
)

// Structs for User and Message
type UserInfo struct {
	Name    string
	Picture string
}

type Message struct {
	ID        int       `json:"id"`
	User      string    `json:"user"`
	Content   string    `json:"content"`
	Timestamp time.Time `json:"timestamp"`
}

// Initialize database
func initDB() {
	var err error
	db, err = sql.Open("sqlite3", "./chat.db")
	if err != nil {
		log.Fatal("Failed to connect to database:", err)
	}
	_, err = db.Exec(`
		CREATE TABLE IF NOT EXISTS messages (
			id INTEGER PRIMARY KEY AUTOINCREMENT,
			user TEXT,
			content TEXT,
			timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
		);
	`)
	if err != nil {
		log.Fatal("Error creating table:", err)
	}
}

// WebSocket handler
func handleWebSocket(c echo.Context) error {
	conn, err := upgrader.Upgrade(c.Response(), c.Request(), nil)
	if err != nil {
		log.Println("WebSocket upgrade error:", err)
		return err
	}
	defer conn.Close()

	mu.Lock()
	connections[conn] = true
	mu.Unlock()

	for {
		var msg Message
		err := conn.ReadJSON(&msg)
		if err != nil {
			log.Println("Read error:", err)
			mu.Lock()
			delete(connections, conn)
			mu.Unlock()
			break
		}

		msg.Timestamp = time.Now()

		// Store message in database
		_, err = db.Exec("INSERT INTO messages (user, content, timestamp) VALUES (?, ?, ?)", msg.User, msg.Content, msg.Timestamp)
		if err != nil {
			log.Println("Database insert error:", err)
		}

		// Broadcast to all clients
		mu.Lock()
		for conn := range connections {
			err = conn.WriteJSON(msg)
			if err != nil {
				log.Println("Write error:", err)
				delete(connections, conn)
			}
		}
		mu.Unlock()
	}
	return nil
}

// Authentication handler
func loginHandler(c echo.Context) error {
	session, _ := store.Get(c.Request(), "session-name")

	// Debug: Print session values
	log.Println("Session values:", session.Values)

	user := session.Values["user"]
	if user == nil {
		return c.String(http.StatusUnauthorized, "Unauthorized")
	}
	return c.JSON(http.StatusOK, user)
}

// Serve templates
func renderTemplate(c echo.Context, name string, data interface{}) error {
	tmpl, err := template.ParseFiles(
		"templates/" + name + ".html",
	)
	if err != nil {
		return err
	}
	return tmpl.Execute(c.Response().Writer, data)
}

func homeHandler(c echo.Context) error {
	return renderTemplate(c, "chat", nil)
}

func registerHandler(c echo.Context) error {
	return renderTemplate(c, "register", nil)
}

func main() {
	// Load environment variables
	if err := godotenv.Load(); err != nil {
		log.Println("No .env file found")
	}

	initDB()
	defer db.Close()

	e := echo.New()
	e.Use(middleware.Logger())
	e.Use(middleware.Recover())

	// Static file serving
	e.Static("/static", "internal/static")

	// Route handlers
	e.GET("/", func(c echo.Context) error {
		if c.QueryParam("search") != "" {
			return layout.HandleSearch(c)
		}
		return layout.Home(c)
	})
	e.GET("/chat", homeHandler)
	e.GET("/register", registerHandler)
	e.GET("/ws", handleWebSocket)
	e.GET("/login", loginHandler)

	// Start server
	port := os.Getenv("PORT")
	if port == "" {
		port = "8080"
	}
	log.Println("Server started on port:", port)
	e.Logger.Fatal(e.Start(":" + port))
}
