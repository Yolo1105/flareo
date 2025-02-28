package main

import (
	"context"
	"database/sql"
	"encoding/json"
	"fmt"
	"html/template"
	"io"
	"log"
	"net/http"
	"os"
	"runtime"
	"strings"
	"sync"
	"time"

	"github.com/labstack/echo/v4"
	"github.com/labstack/echo/v4/middleware"
	"github.com/gorilla/sessions"
	"github.com/gorilla/websocket"
	"github.com/joho/godotenv"
	_ "github.com/mattn/go-sqlite3"
	"golang.org/x/oauth2"
	"golang.org/x/oauth2/google"
)

// UserInfo represents a user with name and profile picture
type UserInfo struct {
	Name    string
	Picture string
}

// Message represents a chat message
type Message struct {
	ID         int    `json:"id"`
	SenderID   string `json:"sender_id"`
	ReceiverID string `json:"receiver_id"`
	Content    string `json:"content"`
	Timestamp  string `json:"timestamp"`
	Status     string `json:"status"`
	Picture    string `json:"picture,omitempty"`
	Name       string `json:"name,omitempty"`
}

var (
	// templates = template.Must(template.ParseGlob("templates/*.html"))

	templates *template.Template

	clients = struct {
		sync.RWMutex
		connections map[string]*websocket.Conn
		users       map[string]UserInfo
	}{
		connections: make(map[string]*websocket.Conn),
		users:       make(map[string]UserInfo),
	}

	upgrader = websocket.Upgrader{
		CheckOrigin:     func(r *http.Request) bool { return true },
		ReadBufferSize:  4096,
		WriteBufferSize: 4096,
	}

	db                *sql.DB
	googleOauthConfig *oauth2.Config
	echoServer        *echo.Echo

	// Session store
	sessionStore = sessions.NewCookieStore([]byte("super-secret-key"))

	// Server start time
	startTime = time.Now()
	debug     = os.Getenv("DEBUG") == "true"
)

func loadTemplates() {
	tmpls, err := template.New("").Funcs(template.FuncMap{
		"url": func(s string) string { return s },
	}).ParseGlob("templates/*.html")

	if err != nil {
		log.Printf("WARNING: Failed to load templates: %v", err)
		log.Println("Ensure templates directory exists with required files.")
		templates = template.New("fallback") // ✅ Properly set `templates`
	} else {
		templates = tmpls
		log.Println("✅ Templates loaded successfully.")
	}
}

func init() {
    // Set up logging
    log.SetFlags(log.Ldate | log.Ltime | log.Lshortfile)
    
	loadTemplates()
    // Initialize templates - don't fail if templates don't exist yet
    if _, err := os.Stat("templates"); os.IsNotExist(err) {
		log.Println("⚠️ Templates directory does not exist. Creating default...")
		os.Mkdir("templates", 0755)
	}
	
	tmpls, err := template.ParseGlob("templates/*.html")
	if err != nil {
		log.Printf("⚠️ Failed to load templates: %v", err)
		templates = template.New("fallback")
	} else {
		templates = tmpls
		log.Println("✅ Successfully loaded templates.")
	}
    
    // Session options setup
    isLocalDev := os.Getenv("ENV") != "production"
    sessionStore.Options = &sessions.Options{
        Path:     "/",
        MaxAge:   3600, // 1 hour expiration
        HttpOnly: true,
        Secure:   !isLocalDev,
        SameSite: http.SameSiteLaxMode,
    }
}

func debugLog(format string, args ...interface{}) {
	if debug {
		log.Printf("[DEBUG] "+format, args...)
	}
}

func main() {
	defer func() {
		if r := recover(); r != nil {
			log.Printf("Recovered from panic: %v", r)
		}
	}()

	templatesDir := "customer_service_chat/templates"
	if _, err := os.Stat(templatesDir); os.IsNotExist(err) {
		log.Printf("Creating templates directory: %s", templatesDir)
		if err := os.MkdirAll(templatesDir, 0755); err != nil {
			log.Printf("Warning: Failed to create templates directory: %v", err)
		}
	}

	// Initialize templates from the correct path
	tmpls, err := template.ParseGlob(templatesDir + "/*.html")
	if err != nil {
		log.Printf("Warning: Failed to load templates: %v", err)
	} else {
		templates = tmpls
		log.Printf("Successfully loaded templates from %s", templatesDir)
	}

	db = InitDB()
	defer db.Close()

	// Ensure database connection is working
	if err := db.Ping(); err != nil {
		log.Fatal("Database connection failed:", err)
	}

	loadOAuthConfig()

	// Create static folder if it doesn't exist
	if _, err := os.Stat("static"); os.IsNotExist(err) {
		os.Mkdir("static", 0755)
	}

	// Initialize Echo server for e-commerce functionality
	echoServer = echo.New()
	echoServer.Use(middleware.Logger())
	echoServer.Use(middleware.Recover())
	echoServer.Static("/static", "static")

	// Setup routes for e-commerce
	setupEcommerceRoutes()

	// Set up chat server routes
	http.HandleFunc("/chat", chatHandler)
	http.HandleFunc("/login", loginPageHandler)
	http.HandleFunc("/register", registerPageHandler)
	http.HandleFunc("/logout", logoutHandler)
	http.HandleFunc("/ws", wsHandler)
	http.HandleFunc("/messages", messagesHandler)
	http.HandleFunc("/users", onlineUsersHandler)
	http.HandleFunc("/auth/google", googleLoginHandler)
	http.HandleFunc("/auth/google/callback", googleCallbackHandler)
	http.HandleFunc("/register-manual", manualRegisterHandler)

	// Health check endpoint
	http.HandleFunc("/health", func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Content-Type", "application/json")
		json.NewEncoder(w).Encode(map[string]interface{}{
			"status":      "healthy",
			"connections": len(clients.connections),
			"uptime":      time.Since(startTime).String(),
			"go_version":  runtime.Version(),
			"go_routines": runtime.NumGoroutine(),
		})
	})

	// Override the root handler to provide a unified entry point
	http.HandleFunc("/", homeHandler)

	// Session debug endpoint
	http.HandleFunc("/debug/session", sessionDebugHandler)

	// Add periodic refresh mechanism to sync user online status
	go func() {
		ticker := time.NewTicker(10 * time.Second)
		defer ticker.Stop()

		for range ticker.C {
			// Broadcast user status updates every 10 seconds
			broadcastUserListUpdate()
		}
	}()

	// Start cleanup task
	go cleanupSessions()

	// Serve static files
	http.Handle("/static/", http.StripPrefix("/static/", http.FileServer(http.Dir("static"))))

	// Start the Echo server in a goroutine
	go func() {
		if err := echoServer.Start(":8081"); err != nil {
			log.Printf("Echo server error: %v", err)
		}
	}()

	fmt.Println("🚀 Server running at http://localhost:8080")
	go func() {
		if err := echoServer.Start(":8081"); err != nil {
			log.Printf("⚠️ Echo server error: %v", err)
		}
	}()
	log.Fatal(http.ListenAndServe(":8080", nil))
}

// Home handler - Central entry point with links to different applications
func homeHandler(w http.ResponseWriter, r *http.Request) {
	if r.URL.Path != "/" {
		// Check if this is an e-commerce route
		if strings.HasPrefix(r.URL.Path, "/country/") || 
		   strings.HasPrefix(r.URL.Path, "/search/countries") ||
		   r.URL.Path == "/ecommerce" {
			// Forward to Echo handler
			echoServer.ServeHTTP(w, r)
			return
		}
		
		http.NotFound(w, r)
		return
	}

	// Check if logged in for the chat application
	googleID := getGoogleID(r)
	if googleID != "" {
		// Check if user is registered
		var registered int
		err := db.QueryRow("SELECT COALESCE(registered, 0) FROM users WHERE google_id = ?", googleID).Scan(&registered)
		if err == nil && registered == 1 {
			// If already logged in, offer choice between applications
			serveHomePage(w, r, true)
			return
		} else {
			http.Redirect(w, r, "/register", http.StatusSeeOther)
			return
		}
	}

	// Not logged in, show home page with application options
	serveHomePage(w, r, false)
}

// Serve the home page with links to different applications
func serveHomePage(w http.ResponseWriter, r *http.Request, loggedIn bool) {
	html := `
<!DOCTYPE html>
<html>
<head>
    <title>Multi-Function Application</title>
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <style>
        body {
            font-family: Arial, sans-serif;
            line-height: 1.6;
            max-width: 800px;
            margin: 0 auto;
            padding: 20px;
            color: #333;
        }
        h1 {
            color: #2c3e50;
            border-bottom: 2px solid #3498db;
            padding-bottom: 10px;
        }
        .app-container {
            display: flex;
            flex-wrap: wrap;
            gap: 20px;
            margin-top: 20px;
        }
        .app-card {
            flex: 1;
            min-width: 250px;
            border: 1px solid #ddd;
            border-radius: 8px;
            padding: 20px;
            box-shadow: 0 2px 5px rgba(0,0,0,0.1);
        }
        .app-card h2 {
            margin-top: 0;
            color: #3498db;
        }
        .app-card p {
            margin-bottom: 20px;
        }
        .btn {
            display: inline-block;
            background-color: #3498db;
            color: white;
            padding: 8px 16px;
            border-radius: 4px;
            text-decoration: none;
            font-weight: bold;
            transition: background-color 0.3s;
        }
        .btn:hover {
            background-color: #2980b9;
        }
        .login-status {
            margin-bottom: 20px;
            padding: 10px;
            background-color: #e8f4f8;
            border-radius: 4px;
        }
        .login-btn {
            background-color: #2ecc71;
        }
        .login-btn:hover {
            background-color: #27ae60;
        }
    </style>
</head>
<body>
    <h1>Welcome to Our Multi-Function Application</h1>
`

	if loggedIn {
		html += `
    <div class="login-status">
        You are currently logged in. You can access the messaging application or browse our product catalog.
        <a href="/logout" class="btn" style="background-color: #e74c3c; margin-left: 10px;">Logout</a>
    </div>
`
	} else {
		html += `
    <div class="login-status">
        You are not logged in. You can still browse our product catalog or login to access the messaging application.
        <a href="/login" class="btn login-btn">Login</a>
    </div>
`
	}

	html += `
    <div class="app-container">
        <div class="app-card">
            <h2>Messaging Application</h2>
            <p>Chat with other users in real-time. Share messages and stay connected.</p>
`

	if loggedIn {
		html += `<a href="/chat" class="btn">Open Chat</a>`
	} else {
		html += `<a href="/login" class="btn">Login to Chat</a>`
	}

	html += `
        </div>
        <div class="app-card">
            <h2>E-Commerce Catalog</h2>
            <p>Browse our products by country. Find the best items from around the world.</p>
            <a href="/ecommerce" class="btn">Browse Products</a>
        </div>
    </div>
</body>
</html>
`
	w.Header().Set("Content-Type", "text/html")
	w.Write([]byte(html))
}

func sessionDebugHandler(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "text/html")
	fmt.Fprintln(w, "<h1>Session & Cookie Debug</h1>")

	// Display all cookies
	fmt.Fprintln(w, "<h2>Cookies:</h2><ul>")
	for _, cookie := range r.Cookies() {
		fmt.Fprintf(w, "<li>%s = %s (Secure: %v, HttpOnly: %v)</li>",
			cookie.Name, cookie.Value, cookie.Secure, cookie.HttpOnly)
	}
	fmt.Fprintln(w, "</ul>")

	// Display user session
	fmt.Fprintln(w, "<h2>User Session:</h2>")
	session, err := sessionStore.Get(r, "user-session")
	if err != nil {
		fmt.Fprintf(w, "<p>Error getting session: %v</p>", err)
	} else {
		fmt.Fprintln(w, "<ul>")
		for k, v := range session.Values {
			fmt.Fprintf(w, "<li>%v = %v</li>", k, v)
		}
		fmt.Fprintln(w, "</ul>")
	}

	// Display OAuth state session
	fmt.Fprintln(w, "<h2>OAuth State Session:</h2>")
	oauthSession, err := sessionStore.Get(r, "oauth-state")
	if err != nil {
		fmt.Fprintf(w, "<p>Error getting OAuth session: %v</p>", err)
	} else {
		fmt.Fprintln(w, "<ul>")
		for k, v := range oauthSession.Values {
			fmt.Fprintf(w, "<li>%v = %v</li>", k, v)
		}
		fmt.Fprintln(w, "</ul>")
	}

	// Display environment state
	fmt.Fprintln(w, "<h2>Environment:</h2>")
	fmt.Fprintf(w, "<p>Debug Mode: %v</p>", debug)
	fmt.Fprintf(w, "<p>ENV: %s</p>", os.Getenv("ENV"))

	// Add login links
	fmt.Fprintln(w, "<p><a href='/login'>Go to Login</a></p>")
	fmt.Fprintln(w, "<p><a href='/logout'>Logout</a></p>")
}

// Periodically clean up expired sessions and disconnected users
func cleanupSessions() {
	ticker := time.NewTicker(30 * time.Minute)
	defer ticker.Stop()

	for range ticker.C {
		// Clean up expired sessions from the database
		_, err := db.Exec("DELETE FROM sessions WHERE expires_at < ?", time.Now())
		if err != nil {
			log.Printf("Error cleaning up sessions: %v", err)
		}

		// Check for inactive connections
		clients.Lock()
		for id := range clients.connections {
			// Try to check the user's last activity time, ignore errors
			var lastLogin time.Time
			err := db.QueryRow("SELECT COALESCE(last_login, CURRENT_TIMESTAMP) FROM users WHERE google_id = ?", id).Scan(&lastLogin)
			if err == nil && time.Since(lastLogin) > 2*time.Hour {
				// If the user has been inactive for more than 2 hours, close the connection
				if conn, ok := clients.connections[id]; ok {
					conn.Close()
					delete(clients.connections, id)
					delete(clients.users, id)
				}
			}
		}
		clients.Unlock()
	}
}

func InitDB() *sql.DB {
	db, err := sql.Open("sqlite3", "users.db")
	if err != nil {
		log.Fatal("Failed to open DB:", err)
	}

	// Set connection pool parameters
	db.SetMaxOpenConns(25)
	db.SetMaxIdleConns(5)
	db.SetConnMaxLifetime(5 * time.Minute)

	// Create users table
	createTableSQL := `
    CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        google_id TEXT UNIQUE NOT NULL,
        email TEXT UNIQUE NOT NULL,
        name TEXT NOT NULL,
        picture TEXT,
        registered INTEGER DEFAULT 0
    );
    `
	if _, err := db.Exec(createTableSQL); err != nil {
		log.Fatal("Failed to create users table:", err)
	}

	// Check if registered column needs to be added
	var colCount int
	err = db.QueryRow("SELECT COUNT(*) FROM pragma_table_info('users') WHERE name='registered'").Scan(&colCount)
	if err != nil || colCount == 0 {
		log.Println("Adding 'registered' column to users table...")
		_, err := db.Exec("ALTER TABLE users ADD COLUMN registered INTEGER DEFAULT 0")
		if err != nil {
			log.Printf("Error adding registered column: %v", err)
		}
	}

	// Check if last_login column needs to be added
	err = db.QueryRow("SELECT COUNT(*) FROM pragma_table_info('users') WHERE name='last_login'").Scan(&colCount)
	if err != nil || colCount == 0 {
		log.Println("Adding 'last_login' column to users table...")
		_, err := db.Exec("ALTER TABLE users ADD COLUMN last_login DATETIME")
		if err != nil {
			log.Printf("Error adding last_login column: %v", err)
		}
	}

	// Create messages table
	createMessagesTable := `
    CREATE TABLE IF NOT EXISTS messages (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        sender_id TEXT NOT NULL,
        receiver_id TEXT NOT NULL,
        content TEXT NOT NULL,
        timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
        status TEXT DEFAULT 'sent'
    );
    `
	if _, err := db.Exec(createMessagesTable); err != nil {
		log.Fatal("Failed to create messages table:", err)
	}

	// Add sessions table
	createSessionTable := `
    CREATE TABLE IF NOT EXISTS sessions (
        session_id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        expires_at DATETIME,
        FOREIGN KEY(user_id) REFERENCES users(google_id)
    );
    `
	if _, err := db.Exec(createSessionTable); err != nil {
		log.Fatal("Failed to create sessions table:", err)
	}

	fmt.Println("✅ Database initialized successfully!")
	return db
}

func loadOAuthConfig() {
	if err := godotenv.Load(".env"); err != nil {
		log.Println("⚠️ Could not load .env file, using system variables...")
	}	

	clientID := os.Getenv("GOOGLE_CLIENT_ID")
	clientSecret := os.Getenv("GOOGLE_CLIENT_SECRET")
	redirectURL := os.Getenv("GOOGLE_REDIRECT_URL")
	if redirectURL == "" {
		redirectURL = "http://localhost:8080/auth/google/callback"
		log.Println("ℹ️ Using default redirect URL:", redirectURL)
	}

	if clientID == "" || clientSecret == "" {
		log.Println("WARNING: Missing Google OAuth credentials!")
	}

	if redirectURL == "" {
		// Default redirect URL for local development
		redirectURL = "http://localhost:8080/auth/google/callback"
		log.Println("Using default redirect URL:", redirectURL)
	}

	log.Println("OAuth Config loaded")

	googleOauthConfig = &oauth2.Config{
		ClientID:     clientID,
		ClientSecret: clientSecret,
		RedirectURL:  redirectURL,
		Scopes: []string{
			"https://www.googleapis.com/auth/userinfo.email",
			"https://www.googleapis.com/auth/userinfo.profile",
			"openid",
		},
		Endpoint: google.Endpoint,
	}
}

// Login page handler
func loginPageHandler(w http.ResponseWriter, r *http.Request) {
	// Clear any existing cookies
	http.SetCookie(w, &http.Cookie{
		Name:     "google_id",
		Value:    "",
		Path:     "/",
		MaxAge:   -1,
		HttpOnly: true,
	})

	// Clear any existing sessions
	session, _ := sessionStore.Get(r, "user-session")
	session.Options.MaxAge = -1
	session.Save(r, w)

	// Check if already logged in
	googleID := getGoogleID(r)
	if googleID != "" {
		var registered int
		err := db.QueryRow("SELECT COALESCE(registered, 0) FROM users WHERE google_id = ?", googleID).Scan(&registered)
		if err == nil && registered == 1 {
			http.Redirect(w, r, "/chat", http.StatusSeeOther)
			return
		}
	}

	// Show login page, possibly with error message
	errorMsg := r.URL.Query().Get("error")
	templates.ExecuteTemplate(w, "login.html", map[string]interface{}{
		"Error": errorMsg,
	})
}

// Registration page handler
func registerPageHandler(w http.ResponseWriter, r *http.Request) {
	googleID := getGoogleID(r)
	if googleID == "" {
		http.Redirect(w, r, "/login", http.StatusSeeOther)
		return
	}

	// Get user information
	var email, name, picture string
	var registered int
	err := db.QueryRow(
		"SELECT email, name, picture, COALESCE(registered, 0) FROM users WHERE google_id = ?",
		googleID,
	).Scan(&email, &name, &picture, &registered)

	if err != nil {
		log.Printf("Error getting user for registration: %v", err)
		renderErrorPage(w,
			"User Not Found",
			"We couldn't find your account. Please try logging in again.",
			http.StatusNotFound,
			"/login",
			"Back to Login",
		)
		return
	}

	// If already registered, redirect to chat
	if registered == 1 {
		http.Redirect(w, r, "/chat", http.StatusSeeOther)
		return
	}

	// Handle registration form submission
	if r.Method == "POST" {
		r.ParseForm()
		displayName := r.FormValue("display_name")
		if displayName != "" {
			// Update username and mark as registered
			_, err := db.Exec(
				"UPDATE users SET name = ?, registered = 1, last_login = CURRENT_TIMESTAMP WHERE google_id = ?",
				displayName, googleID,
			)
			if err != nil {
				log.Println("Error updating user:", err)
				// Check if it's a column not found error, if so, try without updating last_login
				if strings.Contains(err.Error(), "last_login") {
					_, err = db.Exec(
						"UPDATE users SET name = ?, registered = 1 WHERE google_id = ?",
						displayName, googleID,
					)
					if err != nil {
						log.Println("Error updating user (simplified):", err)
						http.Error(w, "Registration failed", http.StatusInternalServerError)
						return
					}
				} else {
					http.Error(w, "Registration failed", http.StatusInternalServerError)
					return
				}
			}

			// Create new session, mark as logged in
			session, _ := sessionStore.Get(r, "user-session")
			session.Values["logged_in"] = true
			session.Save(r, w)

			http.Redirect(w, r, "/chat", http.StatusSeeOther)
			return
		}
	}

	// Show registration page
	templates.ExecuteTemplate(w, "register.html", map[string]interface{}{
		"Email":   email,
		"Name":    name,
		"Picture": picture,
	})
}

// Error page renderer
func renderErrorPage(w http.ResponseWriter, title, message string, code int, returnURL, buttonText string) {
	w.WriteHeader(code)
	templates.ExecuteTemplate(w, "error.html", map[string]interface{}{
		"Title":      title,
		"Message":    message,
		"Code":       code,
		"ReturnURL":  returnURL,
		"ButtonText": buttonText,
	})
}

func googleLoginHandler(w http.ResponseWriter, r *http.Request) {
	// Create a random state to prevent CSRF
	stateToken := fmt.Sprintf("%d", time.Now().UnixNano())
	session, _ := sessionStore.Get(r, "oauth-state")
	session.Values["state"] = stateToken

	isLocalDev := os.Getenv("ENV") != "production"
	if isLocalDev {
		session.Options.Secure = false // Disable Secure for local development
	}

	if err := session.Save(r, w); err != nil {
		log.Printf("Failed to save oauth-state session: %v", err)
		// Try to continue processing anyway
	}

	url := googleOauthConfig.AuthCodeURL(stateToken)
	log.Printf("Redirecting to Google OAuth URL: %s", url)
	http.Redirect(w, r, url, http.StatusTemporaryRedirect)
}

func googleCallbackHandler(w http.ResponseWriter, r *http.Request) {
	log.Println("Starting OAuth callback handling")

	// Verify state to prevent CSRF - relaxed for local development
	session, err := sessionStore.Get(r, "oauth-state")
	if err != nil {
		log.Printf("Session error: %v", err)
		http.Redirect(w, r, "/login?error=Session+error", http.StatusSeeOther)
		return
	}

	expectedState, ok := session.Values["state"].(string)
	if !ok {
		log.Println("No state found in session")
		// Continue processing in development
		if os.Getenv("ENV") == "production" {
			http.Redirect(w, r, "/login?error=Invalid+state", http.StatusSeeOther)
			return
		}
	}

	receivedState := r.URL.Query().Get("state")
	if receivedState != expectedState && os.Getenv("ENV") == "production" {
		log.Printf("State mismatch: expected %s, got %s", expectedState, receivedState)
		http.Redirect(w, r, "/login?error=State+mismatch", http.StatusSeeOther)
		return
	}

	code := r.URL.Query().Get("code")
	if code == "" {
		log.Println("No auth code received")
		http.Redirect(w, r, "/login?error=No+auth+code", http.StatusSeeOther)
		return
	}

	log.Println("Auth code received, exchanging for token")
	token, err := googleOauthConfig.Exchange(context.Background(), code)
	if err != nil {
		log.Printf("Token exchange failed: %v", err)
		http.Redirect(w, r, "/login?error=Token+exchange+failed", http.StatusSeeOther)
		return
	}

	log.Println("Token exchange successful, fetching user info")
	client := googleOauthConfig.Client(context.Background(), token)
	userInfoResp, err := client.Get("https://www.googleapis.com/oauth2/v3/userinfo")
	if err != nil {
		log.Printf("Failed to get user info: %v", err)
		http.Redirect(w, r, "/login?error=User+info+failed", http.StatusSeeOther)
		return
	}
	defer userInfoResp.Body.Close()

	bodyBytes, _ := io.ReadAll(userInfoResp.Body)
	if debug {
		log.Printf("User info response: %s", string(bodyBytes))
	}

	var userInfo map[string]interface{}
	if err := json.Unmarshal(bodyBytes, &userInfo); err != nil {
		log.Printf("Failed to parse user info: %v", err)
		http.Redirect(w, r, "/login?error=Parse+failed", http.StatusSeeOther)
		return
	}

	googleID, _ := userInfo["sub"].(string)
	email, _ := userInfo["email"].(string)
	name, _ := userInfo["name"].(string)
	picture, _ := userInfo["picture"].(string)

	// Save user information to database and check if already registered
	registered := saveUserToDB(googleID, email, name, picture)
	log.Printf("User saved to DB, registered: %v", registered)

	// Set secure session cookie
	isLocalDev := os.Getenv("ENV") != "production"
	http.SetCookie(w, &http.Cookie{
		Name:     "google_id",
		Value:    googleID,
		Path:     "/",
		HttpOnly: true,
		Secure:   !isLocalDev, // Disable Secure in local environment
		SameSite: http.SameSiteLaxMode,
		MaxAge:   3600, // 1 hour
	})

	// Create user session
	userSession, _ := sessionStore.New(r, "user-session")
	userSession.Values["user_id"] = googleID

	// If registered, go directly to chat page, otherwise go to registration page
	if registered {
		log.Println("User is registered, redirecting to chat")
		userSession.Values["logged_in"] = true
		if err := userSession.Save(r, w); err != nil {
			log.Printf("Error saving session: %v", err)
			// Try to continue even if an error occurs
		}

		// Update last login time
		db.Exec("UPDATE users SET last_login = CURRENT_TIMESTAMP WHERE google_id = ?", googleID)

		http.Redirect(w, r, "/chat", http.StatusSeeOther)
		return
	} else {
		log.Println("User needs registration, redirecting to register")
		if err := userSession.Save(r, w); err != nil {
			log.Printf("Error saving session: %v", err)
			// Try to continue even if an error occurs
		}
		http.Redirect(w, r, "/register", http.StatusSeeOther)
		return
	}
}

func saveUserToDB(googleID, email, name, picture string) bool {
	// Check if user already exists
	var registered int
	err := db.QueryRow("SELECT COALESCE(registered, 0) FROM users WHERE google_id = ?", googleID).Scan(&registered)

	if err == sql.ErrNoRows {
		// User doesn't exist, insert new user
		_, err = db.Exec(
			"INSERT INTO users (google_id, email, name, picture, registered) VALUES (?, ?, ?, ?, 0)",
			googleID, email, name, picture,
		)
		if err != nil {
			log.Println("❌ Failed to save new user:", err)
		}
		// Try to update last_login, ignore possible errors
		db.Exec("UPDATE users SET last_login = CURRENT_TIMESTAMP WHERE google_id = ?", googleID)

		return false
	} else if err != nil {
		log.Println("❌ Error checking user registration:", err)
		// If an error occurs, try inserting the user
		_, err = db.Exec(
			"INSERT OR REPLACE INTO users (google_id, email, name, picture, registered) VALUES (?, ?, ?, ?, 0)",
			googleID, email, name, picture,
		)
		if err != nil {
			log.Println("❌ Failed to save user:", err)
		}
		// Try to update last_login, ignore possible errors
		db.Exec("UPDATE users SET last_login = CURRENT_TIMESTAMP WHERE google_id = ?", googleID)

		return false
	} else {
		// User already exists, update information
		_, err = db.Exec(
			"UPDATE users SET email = ?, picture = ? WHERE google_id = ?",
			email, picture, googleID,
		)
		if err != nil {
			log.Println("❌ Failed to update user:", err)
		}
		// Try to update last_login, ignore possible errors
		db.Exec("UPDATE users SET last_login = CURRENT_TIMESTAMP WHERE google_id = ?", googleID)

		return registered == 1
	}
}

// Enhanced user list update broadcast function
func broadcastUserListUpdate() {
	// Get all users IDs and online status
	clients.RLock()
	onlineUsers := make(map[string]bool)
	for id := range clients.connections {
		onlineUsers[id] = true
	}
	clients.RUnlock()

	// Notify all users via WebSocket, including complete user list information
	message := map[string]interface{}{
		"type":         "users_update",
		"online_users": onlineUsers,
		"timestamp":    time.Now().Unix(),
	}

	messageJSON, err := json.Marshal(message)
	if err != nil {
		log.Printf("Error marshaling users update: %v", err)
		return
	}

	// Send to all connected clients
	clients.RLock()
	for _, conn := range clients.connections {
		err := conn.WriteMessage(websocket.TextMessage, messageJSON)
		if err != nil {
			log.Printf("Error sending users update: %v", err)
			// Continue sending to other users
		}
	}
	clients.RUnlock()

	log.Printf("Broadcasted user list update to %d clients", len(clients.connections))
}

func logoutHandler(w http.ResponseWriter, r *http.Request) {
	googleID := getGoogleID(r)
	if googleID != "" {
		// Close WebSocket connection
		clients.Lock()
		if conn, ok := clients.connections[googleID]; ok {
			conn.Close()
		}
		delete(clients.connections, googleID)
		delete(clients.users, googleID)
		clients.Unlock()

		// Broadcast user list update
		broadcastUserListUpdate()

		// Delete session from database
		db.Exec("DELETE FROM sessions WHERE user_id = ?", googleID)

		// Clear session
		session, _ := sessionStore.Get(r, "user-session")
		session.Options.MaxAge = -1
		session.Save(r, w)
	}

	// Clear cookie
	http.SetCookie(w, &http.Cookie{
		Name:     "google_id",
		Value:    "",
		Path:     "/",
		MaxAge:   -1,
		HttpOnly: true,
	})

	http.Redirect(w, r, "/", http.StatusSeeOther)
}

func getPastChatUsers(currentUserID string) []map[string]interface{} {
	rows, err := db.Query(`
        SELECT DISTINCT u.google_id, u.name, u.picture 
        FROM users u
        JOIN messages m ON u.google_id = m.sender_id OR u.google_id = m.receiver_id
        WHERE (m.sender_id = ? OR m.receiver_id = ?)
        AND u.google_id != ?
        GROUP BY u.google_id
    `, currentUserID, currentUserID, currentUserID)

	if err != nil {
		log.Println("Failed to get past chat users:", err)
		return nil
	}
	defer rows.Close()

	var pastChats []map[string]interface{}
	for rows.Next() {
		var id, name, picture string
		if err := rows.Scan(&id, &name, &picture); err == nil {
			pastChats = append(pastChats, map[string]interface{}{
				"id":      id,
				"name":    name,
				"picture": picture,
				"online":  false,
			})
		}
	}
	return pastChats
}

// Optimized user list handler function
func onlineUsersHandler(w http.ResponseWriter, r *http.Request) {
	// Add cache control headers
	w.Header().Set("Cache-Control", "no-cache, no-store, must-revalidate")
	w.Header().Set("Pragma", "no-cache")
	w.Header().Set("Expires", "0")

	currentUserID := getGoogleID(r)
	if currentUserID == "" {
		http.Error(w, "Unauthorized", http.StatusUnauthorized)
		return
	}

	// Check if logged in
	session, _ := sessionStore.Get(r, "user-session")
	if auth, ok := session.Values["logged_in"].(bool); !ok || !auth {
		// Force re-login
		http.SetCookie(w, &http.Cookie{
			Name:     "google_id",
			Value:    "",
			Path:     "/",
			MaxAge:   -1,
			HttpOnly: true,
		})
		http.Error(w, "Session expired", http.StatusUnauthorized)
		return
	}

	// Try to update last activity time, ignore possible errors
	db.Exec("UPDATE users SET last_login = CURRENT_TIMESTAMP WHERE google_id = ?", currentUserID)

	// Get current user information
	var selfUser struct {
		ID      string
		Name    string
		Picture string
	}
	err := db.QueryRow("SELECT google_id, name, picture FROM users WHERE google_id = ?", currentUserID).Scan(
		&selfUser.ID, &selfUser.Name, &selfUser.Picture,
	)
	if err != nil {
		log.Println("Error getting self user:", err)
		http.Error(w, "User not found", http.StatusInternalServerError)
		return
	}

	// Get all other users
	rows, err := db.Query(`
        SELECT google_id, name, picture 
        FROM users 
        WHERE google_id != ? AND registered = 1
        ORDER BY name
    `, currentUserID)

	if err != nil {
		log.Println("Error fetching users:", err)
		http.Error(w, "Database error", http.StatusInternalServerError)
		return
	}
	defer rows.Close()

	var allUsers []map[string]interface{}

	// Get online status information
	clients.RLock()
	onlineUsers := make(map[string]bool)
	for id := range clients.connections {
		onlineUsers[id] = true
	}
	clients.RUnlock()

	// Get all users
	for rows.Next() {
		var id, name, picture string
		if err := rows.Scan(&id, &name, &picture); err == nil {
			allUsers = append(allUsers, map[string]interface{}{
				"id":      id,
				"name":    name,
				"picture": picture,
				"online":  onlineUsers[id],
			})
		}
	}

	templates.ExecuteTemplate(w, "users_list.html", map[string]interface{}{
		"Self": map[string]interface{}{
			"id":      selfUser.ID,
			"name":    selfUser.Name,
			"picture": selfUser.Picture,
			"online":  true,
		},
		"AllUsers": allUsers,
	})
}

func getGoogleID(r *http.Request) string {
	if c, err := r.Cookie("google_id"); err == nil {
		return c.Value
	}
	return ""
}

func getUserName(googleID string) string {
	clients.RLock()
	if user, ok := clients.users[googleID]; ok {
		clients.RUnlock()
		return user.Name
	}
	clients.RUnlock()
	var name string
	err := db.QueryRow("SELECT name FROM users WHERE google_id = ?", googleID).Scan(&name)
	if err != nil {
		log.Println("Failed to get user name:", err)
		return ""
	}
	return name
}

func chatHandler(w http.ResponseWriter, r *http.Request) {
	googleID := getGoogleID(r)
	if googleID == "" {
		http.Redirect(w, r, "/login", http.StatusSeeOther)
		return
	}

	// Validate session
	session, _ := sessionStore.Get(r, "user-session")
	if auth, ok := session.Values["logged_in"].(bool); !ok || !auth {
		// Clear google_id cookie
		http.SetCookie(w, &http.Cookie{
			Name:     "google_id",
			Value:    "",
			Path:     "/",
			MaxAge:   -1,
			HttpOnly: true,
		})
		http.Redirect(w, r, "/login", http.StatusSeeOther)
		return
	}

	// Check if user is registered
	var registered int
	err := db.QueryRow("SELECT COALESCE(registered, 0) FROM users WHERE google_id = ?", googleID).Scan(&registered)
	if err != nil || registered != 1 {
		http.Redirect(w, r, "/register", http.StatusSeeOther)
		return
	}

	// Get user information
	var name, picture string
	err = db.QueryRow("SELECT name, picture FROM users WHERE google_id = ?", googleID).Scan(&name, &picture)
	if err != nil {
		log.Println("Failed to get user info:", err)
		http.Error(w, "User not found", http.StatusUnauthorized)
		return
	}

	// Try to update last activity time, ignore possible errors
	db.Exec("UPDATE users SET last_login = CURRENT_TIMESTAMP WHERE google_id = ?", googleID)

	templates.ExecuteTemplate(w, "chat.html", map[string]interface{}{
		"Username":    name,
		"UserPicture": picture,
		"GoogleID":    googleID,
	})
}

// Optimized WebSocket handler
func wsHandler(w http.ResponseWriter, r *http.Request) {
	googleID := getGoogleID(r)
	if googleID == "" {
		http.Error(w, "Unauthorized", http.StatusUnauthorized)
		return
	}

	// Validate session
	session, _ := sessionStore.Get(r, "user-session")
	if auth, ok := session.Values["logged_in"].(bool); !ok || !auth {
		http.Error(w, "Session expired", http.StatusUnauthorized)
		return
	}

	// Get user information
	var name, picture string
	err := db.QueryRow("SELECT name, picture FROM users WHERE google_id = ?", googleID).Scan(&name, &picture)
	if err != nil {
		log.Println("Failed to get user info for WS connection:", err)
		http.Error(w, "User not found", http.StatusUnauthorized)
		return
	}

	// Upgrade HTTP connection to WebSocket
	conn, err := upgrader.Upgrade(w, r, nil)
	if err != nil {
		log.Printf("WebSocket upgrade error: %v", err)
		return
	}

	// Set appropriate buffer sizes
	conn.SetReadLimit(4096) // Limit message size
	conn.SetReadDeadline(time.Now().Add(120 * time.Second))

	log.Printf("New WebSocket connection from user: %s", googleID)

	// Manage connection
	clients.Lock()
	// Close possible old connection
	if oldConn, exists := clients.connections[googleID]; exists {
		oldConn.Close()
	}
	clients.connections[googleID] = conn
	clients.users[googleID] = UserInfo{Name: name, Picture: picture}
	clients.Unlock()

	// Notify user list update
	broadcastUserListUpdate()

	// Ensure resources are cleaned up when connection closes
	defer func() {
		clients.Lock()
		if clients.connections[googleID] == conn {
			delete(clients.connections, googleID)
			delete(clients.users, googleID)
		}
		clients.Unlock()

		conn.Close()
		broadcastUserListUpdate()
	}()

	// WebSocket heartbeat detection
	go func() {
		ticker := time.NewTicker(30 * time.Second)
		defer ticker.Stop()

		for {
			select {
			case <-ticker.C:
				// Send ping message
				if err := conn.WriteControl(websocket.PingMessage, []byte{}, time.Now().Add(10*time.Second)); err != nil {
					log.Printf("Ping error: %v", err)
					return
				}
			}
		}
	}()

	// Set pong handler function
	conn.SetPongHandler(func(string) error {
		conn.SetReadDeadline(time.Now().Add(120 * time.Second))
		return nil
	})

	// Message processing loop
	for {
		messageType, data, err := conn.ReadMessage()
		if err != nil {
			if websocket.IsUnexpectedCloseError(err, websocket.CloseGoingAway, websocket.CloseAbnormalClosure) {
				log.Printf("WebSocket error: %v", err)
			}
			break
		}

		if messageType != websocket.TextMessage || len(data) == 0 {
			continue
		}

		// Process message asynchronously
		go func(message []byte) {
			if err := handleWebSocketMessage(conn, googleID, message); err != nil {
				log.Printf("Error handling message: %v", err)
			}
		}(data)
	}
}

// Optimized message processing function
func handleWebSocketMessage(conn *websocket.Conn, senderID string, message []byte) error {
	var msg map[string]interface{}
	if err := json.Unmarshal(message, &msg); err != nil {
		return err
	}

	// Check message type
	msgType, _ := msg["type"].(string)

	switch msgType {
	case "typing":
		return handleTypingNotificationFast(conn, senderID, msg)
	case "status_update":
		return handleStatusUpdateFast(conn, senderID, msg)
	default:
		// Default to handling chat messages
		return handleChatMessageFast(conn, senderID, msg)
	}
}

// Efficiently handle chat messages
func handleChatMessageFast(conn *websocket.Conn, senderID string, msg map[string]interface{}) error {
	receiverID, ok := msg["to"].(string)
	if !ok || receiverID == "" {
		return fmt.Errorf("invalid receiver ID")
	}

	content, ok := msg["content"].(string)
	if !ok || content == "" {
		return fmt.Errorf("invalid message content")
	}

	// Get sender information - prioritize cache
	clients.RLock()
	senderInfo, ok := clients.users[senderID]
	clients.RUnlock()

	var senderName, senderPic string
	if ok {
		senderName = senderInfo.Name
		senderPic = senderInfo.Picture
	} else {
		// Fall back to database query
		err := db.QueryRow("SELECT name, picture FROM users WHERE google_id = ?", senderID).Scan(&senderName, &senderPic)
		if err != nil {
			log.Println("Error getting sender info:", err)
			return err
		}
	}

	// Save message to database
	var messageID int64
	result, err := db.Exec(
		"INSERT INTO messages (sender_id, receiver_id, content, status) VALUES (?, ?, ?, ?)",
		senderID, receiverID, content, "sent",
	)
	if err != nil {
		log.Println("Error saving message:", err)
		return err
	}

	messageID, err = result.LastInsertId()
	if err != nil {
		log.Println("Error getting message ID:", err)
		return err
	}

	// Build response message
	responseMsg := map[string]interface{}{
		"id":          messageID,
		"fromId":      senderID,
		"fromName":    senderName,
		"fromPicture": senderPic,
		"content":     content,
		"timestamp":   time.Now().Format(time.RFC3339),
		"status":      "sent",
	}

	// First reply to sender confirming message was saved
	err = conn.WriteJSON(responseMsg)
	if err != nil {
		log.Printf("Error sending message confirmation: %v", err)
	}

	// Check if receiver is online
	clients.RLock()
	receiverConn, receiverOnline := clients.connections[receiverID]
	clients.RUnlock()

	if receiverOnline {
		// Send to receiver
		go func() {
			if err := receiverConn.WriteJSON(responseMsg); err != nil {
				log.Println("Error sending message to receiver:", err)
				return
			}

			// Update message status to delivered
			_, err := db.Exec("UPDATE messages SET status = 'delivered' WHERE id = ?", messageID)
			if err != nil {
				log.Printf("Error updating message status to delivered: %v", err)
			}

			// Notify sender message was delivered
			deliveredMsg := map[string]interface{}{
				"type":      "status_update",
				"messageId": messageID,
				"fromId":    receiverID,
				"toId":      senderID, // Add receiver ID so sender knows which conversation
				"status":    "delivered",
			}

			conn.WriteJSON(deliveredMsg)
		}()
	}

	return nil
}

// Efficiently handle typing notifications
func handleTypingNotificationFast(conn *websocket.Conn, senderID string, msg map[string]interface{}) error {
	receiverID, ok := msg["to"].(string)
	if !ok || receiverID == "" {
		return nil
	}

	// Get sender name
	clients.RLock()
	senderInfo, hasInfo := clients.users[senderID]
	receiverConn, receiverOnline := clients.connections[receiverID]
	clients.RUnlock()

	if !receiverOnline {
		return nil
	}

	var senderName string
	if hasInfo {
		senderName = senderInfo.Name
	} else {
		err := db.QueryRow("SELECT name FROM users WHERE google_id = ?", senderID).Scan(&senderName)
		if err != nil {
			return nil
		}
	}

	// Send notification
	typingMsg := map[string]interface{}{
		"type":     "typing",
		"fromId":   senderID,
		"fromName": senderName,
	}

	return receiverConn.WriteJSON(typingMsg)
}

// Efficiently handle status updates
func handleStatusUpdateFast(conn *websocket.Conn, senderID string, msg map[string]interface{}) error {
	receiverID, ok := msg["to"].(string)
	if !ok || receiverID == "" {
		return nil
	}

	var messageID int64

	// Handle different messageId types
	switch id := msg["messageId"].(type) {
	case float64:
		messageID = int64(id)
	case string:
		fmt.Sscanf(id, "%d", &messageID)
	default:
		return nil
	}

	status, ok := msg["status"].(string)
	if !ok || (status != "delivered" && status != "read") {
		return nil
	}

	// Update database
	_, err := db.Exec(
		"UPDATE messages SET status = ? WHERE id = ? AND sender_id = ?",
		status, messageID, receiverID,
	)

	if err != nil {
		log.Printf("Error updating message status: %v", err)
		return nil
	}

	// Create status update message
	statusMsg := map[string]interface{}{
		"type":      "status_update",
		"messageId": messageID,
		"fromId":    senderID,
		"toId":      receiverID,
		"status":    status,
	}

	// Notify message sender (original sender)
	clients.RLock()
	if receiverConn, receiverOnline := clients.connections[receiverID]; receiverOnline {
		receiverConn.WriteJSON(statusMsg)
	}
	clients.RUnlock()

	// Return confirmation to current user
	statusAckMsg := map[string]interface{}{
		"type":      "status_ack",
		"messageId": messageID,
		"status":    status,
		"success":   true,
	}
	conn.WriteJSON(statusAckMsg)

	return nil
}

// Optimized message history retrieval
func messagesHandler(w http.ResponseWriter, r *http.Request) {
	currentUserID := getGoogleID(r)
	if currentUserID == "" {
		http.Error(w, "Unauthorized", http.StatusUnauthorized)
		return
	}

	// Validate session
	session, _ := sessionStore.Get(r, "user-session")
	if auth, ok := session.Values["logged_in"].(bool); !ok || !auth {
		http.Error(w, "Session expired", http.StatusUnauthorized)
		return
	}

	partnerID := r.URL.Query().Get("with")
	if partnerID == "" {
		http.Error(w, "Missing partner ID", http.StatusBadRequest)
		return
	}

	// Limit returned messages
	limit := 100

	// Query message history
	rows, err := db.Query(`
        SELECT m.id, m.sender_id, m.content, m.timestamp, m.status, u.name, u.picture 
        FROM messages m
        JOIN users u ON m.sender_id = u.google_id
        WHERE (m.sender_id = ? AND m.receiver_id = ?)
        OR (m.sender_id = ? AND m.receiver_id = ?)
        ORDER BY m.timestamp DESC
        LIMIT ?
    `, currentUserID, partnerID, partnerID, currentUserID, limit,
	)

	if err != nil {
		http.Error(w, "Database error: "+err.Error(), http.StatusInternalServerError)
		return
	}
	defer rows.Close()

	var messages []map[string]interface{}
	var messageIDs []int

	for rows.Next() {
		var id int
		var senderID, content, timestamp, status, name, picture string
		if err := rows.Scan(&id, &senderID, &content, &timestamp, &status, &name, &picture); err != nil {
			continue
		}

		// If it's an unread received message, record ID to mark as read
		if senderID == partnerID && status != "read" {
			messageIDs = append(messageIDs, id)
		}

		messages = append(messages, map[string]interface{}{
			"id":        id,
			"sender_id": senderID,
			"content":   content,
			"timestamp": timestamp,
			"status":    status,
			"name":      name,
			"picture":   picture,
		})
	}

	// Reverse list to display in chronological order
	for i, j := 0, len(messages)-1; i < j; i, j = i+1, j-1 {
		messages[i], messages[j] = messages[j], messages[i]
	}

	// Update messages to read status in background
	if len(messageIDs) > 0 {
		go func(ids []int) {
			// Batch update
			placeholders := make([]string, len(ids))
			for i := range placeholders {
				placeholders[i] = "?"
			}

			query := fmt.Sprintf(
				"UPDATE messages SET status = 'read' WHERE id IN (%s)",
				strings.Join(placeholders, ","),
			)

			args := make([]interface{}, len(ids))
			for i, id := range ids {
				args[i] = id
			}

			_, err := db.Exec(query, args...)
			if err != nil {
				log.Printf("Error updating message status: %v", err)
				return
			}

			// Notify sender messages are read
			clients.RLock()
			if conn, ok := clients.connections[partnerID]; ok {
				for _, id := range ids {
					readReceipt := map[string]interface{}{
						"type":      "status_update",
						"messageId": id,
						"fromId":    currentUserID,
						"toId":      partnerID,
						"status":    "read",
					}
					conn.WriteJSON(readReceipt)
				}
			}
			clients.RUnlock()
		}(messageIDs)
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(messages)
}

// Manual registration handler function
func manualRegisterHandler(w http.ResponseWriter, r *http.Request) {
	if r.Method == "GET" {
		// Show registration form
		w.Header().Set("Content-Type", "text/html")
		fmt.Fprint(w, `
            <!DOCTYPE html>
            <html>
            <head>
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <title>Manual Registration</title>
                <style>
                    body {
                        font-family: "Segoe UI", Tahoma, Geneva, Verdana, sans-serif;
                        background-color: #f9f9f9;
                        display: flex;
                        justify-content: center;
                        align-items: center;
                        height: 100vh;
                        margin: 0;
                        padding: 0;
                    }
                    .container {
                        background-color: white;
                        padding: 2rem;
                        border-radius: 8px;
                        box-shadow: 0 0 20px rgba(0, 0, 0, 0.1);
                        text-align: center;
                        width: 400px;
                    }
                    h1 {
                        color: #4a90e2;
                        margin-bottom: 1.5rem;
                    }
                    form {
                        display: flex;
                        flex-direction: column;
                    }
                    input {
                        padding: 0.75rem;
                        margin-bottom: 1rem;
                        border: 1px solid #ddd;
                        border-radius: 4px;
                    }
                    button {
                        padding: 0.75rem 1.5rem;
                        background-color: #4a90e2;
                        color: white;
                        border: none;
                        border-radius: 4px;
                        font-size: 1rem;
                        font-weight: bold;
                        cursor: pointer;
                        transition: background-color 0.3s ease;
                    }
                    button:hover {
                        background-color: #357ae8;
                    }
                    .login-link {
                        margin-top: 1rem;
                        display: block;
                        color: #4a90e2;
                        text-decoration: none;
                    }
                </style>
            </head>
            <body>
                <div class="container">
                    <h1>Register for Chat</h1>
                    <form method="POST">
                        <input type="text" name="name" placeholder="Your Name" required>
                        <input type="email" name="email" placeholder="Your Email" required>
                        <button type="submit">Register</button>
                    </form>
                    <a href="/login" class="login-link">Already have an account? Login</a>
                </div>
            </body>
            </html>
        `)
		return
	}

	if r.Method == "POST" {
		r.ParseForm()
		name := r.FormValue("name")
		email := r.FormValue("email")

		if name == "" || email == "" {
			http.Error(w, "Name and email are required", http.StatusBadRequest)
			return
		}

		// Create a unique ID
		googleID := fmt.Sprintf("manual_%d", time.Now().UnixNano())

		// Save user to database
		_, err := db.Exec(
			"INSERT INTO users (google_id, email, name, picture, registered) VALUES (?, ?, ?, ?, 1)",
			googleID, email, name, "/static/default-avatar.png",
		)

		if err != nil {
			log.Printf("Error creating manual user: %v", err)
			http.Error(w, "Registration failed. Please try again.", http.StatusInternalServerError)
			return
		}

		// Try to update last_login, ignore possible errors
		db.Exec("UPDATE users SET last_login = CURRENT_TIMESTAMP WHERE google_id = ?", googleID)

		// Set cookie and session
		http.SetCookie(w, &http.Cookie{
			Name:     "google_id",
			Value:    googleID,
			Path:     "/",
			HttpOnly: true,
			MaxAge:   3600,
		})

		session, _ := sessionStore.Get(r, "user-session")
		session.Values["user_id"] = googleID
		session.Values["logged_in"] = true
		session.Save(r, w)

		// Redirect to chat page
		http.Redirect(w, r, "/chat", http.StatusSeeOther)
	}
}

// Setup routes for e-commerce functionality
func setupEcommerceRoutes() {
	// Root route handler - serves home page or handles search redirects
	echoServer.GET("/ecommerce", func(c echo.Context) error {
		return c.HTML(http.StatusOK, `
            <!DOCTYPE html>
            <html>
            <head>
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <title>E-Commerce Application</title>
                <style>
                    body {
                        font-family: Arial, sans-serif;
                        line-height: 1.6;
                        margin: 0;
                        padding: 20px;
                        max-width: 1200px;
                        margin: 0 auto;
                    }
                    h1 {
                        color: #2c3e50;
                        border-bottom: 2px solid #3498db;
                        padding-bottom: 10px;
                    }
                    .countries {
                        display: flex;
                        flex-wrap: wrap;
                        gap: 20px;
                        margin-top: 20px;
                    }
                    .country-card {
                        border: 1px solid #ddd;
                        border-radius: 8px;
                        padding: 15px;
                        width: 200px;
                        text-align: center;
                        box-shadow: 0 2px 5px rgba(0,0,0,0.1);
                    }
                    .country-card img {
                        max-width: 100%;
                        height: auto;
                        border-radius: 4px;
                    }
                    .country-card h2 {
                        margin-top: 10px;
                        color: #3498db;
                    }
                    .btn {
                        display: inline-block;
                        background-color: #3498db;
                        color: white;
                        padding: 8px 16px;
                        border-radius: 4px;
                        text-decoration: none;
                        margin-top: 10px;
                        font-weight: bold;
                    }
                    .btn:hover {
                        background-color: #2980b9;
                    }
                    .search-container {
                        margin: 20px 0;
                    }
                    .search-input {
                        padding: 8px;
                        width: 300px;
                        border: 1px solid #ddd;
                        border-radius: 4px;
                    }
                    .search-button {
                        padding: 8px 16px;
                        background-color: #3498db;
                        color: white;
                        border: none;
                        border-radius: 4px;
                        cursor: pointer;
                        margin-left: 5px;
                    }
                    .home-link {
                        display: inline-block;
                        margin-top: 20px;
                        color: #3498db;
                        text-decoration: none;
                    }
                </style>
            </head>
            <body>
                <h1>Browse Products by Country</h1>
                
                <div class="search-container">
                    <form action="/country" method="get">
                        <input type="text" name="search" placeholder="Search for a country..." class="search-input">
                        <button type="submit" class="search-button">Search</button>
                    </form>
                </div>
                
                <div class="countries">
                    <div class="country-card">
                        <img src="https://via.placeholder.com/150?text=USA" alt="USA">
                        <h2>USA</h2>
                        <a href="/country/usa" class="btn">Browse Products</a>
                    </div>
                    
                    <div class="country-card">
                        <img src="https://via.placeholder.com/150?text=UK" alt="UK">
                        <h2>UK</h2>
                        <a href="/country/uk" class="btn">Browse Products</a>
                    </div>
                    
                    <div class="country-card">
                        <img src="https://via.placeholder.com/150?text=Japan" alt="Japan">
                        <h2>Japan</h2>
                        <a href="/country/japan" class="btn">Browse Products</a>
                    </div>
                    
                    <div class="country-card">
                        <img src="https://via.placeholder.com/150?text=Germany" alt="Germany">
                        <h2>Germany</h2>
                        <a href="/country/germany" class="btn">Browse Products</a>
                    </div>
                    
                    <div class="country-card">
                        <img src="https://via.placeholder.com/150?text=Australia" alt="Australia">
                        <h2>Australia</h2>
                        <a href="/country/australia" class="btn">Browse Products</a>
                    </div>
                </div>
                
                <a href="/" class="home-link">← Back to Home</a>
            </body>
            </html>
        `)
	})

	// Country details page route handler
	echoServer.GET("/country/:country", func(c echo.Context) error {
		country := c.Param("country")
		if country == "" {
			return c.Redirect(http.StatusFound, "/ecommerce")
		}

		return c.HTML(http.StatusOK, fmt.Sprintf(`
            <!DOCTYPE html>
            <html>
            <head>
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <title>Products from %s</title>
                <style>
                    body {
                        font-family: Arial, sans-serif;
                        line-height: 1.6;
                        margin: 0;
                        padding: 20px;
                        max-width: 1200px;
                        margin: 0 auto;
                    }
                    h1 {
                        color: #2c3e50;
                        border-bottom: 2px solid #3498db;
                        padding-bottom: 10px;
                    }
                    .products {
                        display: flex;
                        flex-wrap: wrap;
                        gap: 20px;
                        margin-top: 20px;
                    }
                    .product {
                        border: 1px solid #ddd;
                        border-radius: 8px;
                        padding: 15px;
                        width: 300px;
                        box-shadow: 0 2px 5px rgba(0,0,0,0.1);
                    }
                    .product img {
                        max-width: 100%%;
                        height: auto;
                        border-radius: 4px;
                    }
                    .product h2 {
                        color: #3498db;
                        margin-top: 10px;
                    }
                    .product p {
                        color: #7f8c8d;
                    }
                    .product .price {
                        font-size: 1.2rem;
                        font-weight: bold;
                        color: #2c3e50;
                    }
                    .btn {
                        display: inline-block;
                        background-color: #3498db;
                        color: white;
                        padding: 8px 16px;
                        border-radius: 4px;
                        text-decoration: none;
                        margin-top: 10px;
                        font-weight: bold;
                    }
                    .btn:hover {
                        background-color: #2980b9;
                    }
                    .home-link {
                        display: inline-block;
                        margin-top: 20px;
                        color: #3498db;
                        text-decoration: none;
                    }
                </style>
            </head>
            <body>
                <h1>Products from %s</h1>
                
                <div class="products">
                    <div class="product">
                        <img src="https://via.placeholder.com/300x200?text=Product+1" alt="Product 1">
                        <h2>Premium Product</h2>
                        <p>High-quality product made in %s with premium materials.</p>
                        <div class="price">$149.99</div>
                        <a href="#" class="btn">Add to Cart</a>
                    </div>
                    
                    <div class="product">
                        <img src="https://via.placeholder.com/300x200?text=Product+2" alt="Product 2">
                        <h2>Standard Item</h2>
                        <p>Reliable and affordable product from %s manufacturers.</p>
                        <div class="price">$79.99</div>
                        <a href="#" class="btn">Add to Cart</a>
                    </div>
                    
                    <div class="product">
                        <img src="https://via.placeholder.com/300x200?text=Product+3" alt="Product 3">
                        <h2>Luxury Selection</h2>
                        <p>Exclusive item designed in %s for discriminating tastes.</p>
                        <div class="price">$249.99</div>
                        <a href="#" class="btn">Add to Cart</a>
                    </div>
                    
                    <div class="product">
                        <img src="https://via.placeholder.com/300x200?text=Product+4" alt="Product 4">
                        <h2>Value Package</h2>
                        <p>Great deal on this collection of %s products.</p>
                        <div class="price">$119.99</div>
                        <a href="#" class="btn">Add to Cart</a>
                    </div>
                </div>
                
                <a href="/ecommerce" class="home-link">← Back to Countries</a>
                <a href="/" class="home-link" style="margin-left: 20px;">← Back to Home</a>
            </body>
            </html>
        `, country, country, country, country, country))
	})

	// Autocomplete search API endpoint
	echoServer.GET("/search/countries", func(c echo.Context) error {
		query := c.QueryParam("q")
		if query == "" {
			return c.JSON(http.StatusOK, []string{})
		}

		// Simple in-memory search for countries
		countries := []string{
			"USA", "Canada", "Mexico", "United Kingdom", "France", "Germany",
			"Spain", "Italy", "Japan", "China", "Australia", "Brazil",
		}

		var results []string
		for _, country := range countries {
			if strings.Contains(strings.ToLower(country), strings.ToLower(query)) {
				results = append(results, country)
			}
		}

		return c.JSON(http.StatusOK, results)
	})
}