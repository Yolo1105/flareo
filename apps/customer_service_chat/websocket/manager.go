package websocket

import (
	"log"
	"net/http"
	"sync"

	"github.com/gorilla/websocket"
)

type Client struct {
	Conn     *websocket.Conn
	UserID   string
	UserInfo map[string]interface{}
}

type Manager struct {
	clients    map[string]*Client
	broadcast  chan []byte
	register   chan *Client
	unregister chan *Client
	mu         sync.RWMutex
}

var (
	upgrader = websocket.Upgrader{
		CheckOrigin: func(r *http.Request) bool { return true },
	}
)

// NewManager creates a new WebSocket manager.
func NewManager() *Manager {
	return &Manager{
		clients:    make(map[string]*Client),
		broadcast:  make(chan []byte),
		register:   make(chan *Client),
		unregister: make(chan *Client),
	}
}

// Run starts the WebSocket manager.
func (m *Manager) Run() {
	for {
		select {
		case client := <-m.register:
			m.mu.Lock()
			m.clients[client.UserID] = client
			m.mu.Unlock()
		case client := <-m.unregister:
			m.mu.Lock()
			if _, ok := m.clients[client.UserID]; ok {
				delete(m.clients, client.UserID)
				client.Conn.Close()
			}
			m.mu.Unlock()
		case message := <-m.broadcast:
			m.mu.RLock()
			for _, client := range m.clients {
				if err := client.Conn.WriteMessage(websocket.TextMessage, message); err != nil {
					log.Printf("Error broadcasting message: %v", err)
				}
			}
			m.mu.RUnlock()
		}
	}
}

// HandleWebSocket upgrades the HTTP connection to a WebSocket connection.
func (m *Manager) HandleWebSocket(w http.ResponseWriter, r *http.Request, userID string, userInfo map[string]interface{}) {
	conn, err := upgrader.Upgrade(w, r, nil)
	if err != nil {
		log.Printf("Error upgrading to WebSocket: %v", err)
		return
	}

	client := &Client{
		Conn:     conn,
		UserID:   userID,
		UserInfo: userInfo,
	}

	m.register <- client

	go func() {
		defer func() {
			m.unregister <- client
		}()

		for {
			_, message, err := conn.ReadMessage()
			if err != nil {
				log.Printf("Error reading message: %v", err)
				break
			}
			m.broadcast <- message
		}
	}()
} 