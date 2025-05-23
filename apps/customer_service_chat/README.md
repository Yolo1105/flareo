# Customer Service Chat

A Go-based customer service chat application with real-time messaging, user authentication, and session management.

## Overview

- Real-time chat using WebSockets
- User authentication via Google OAuth
- Session management with secure cookies
- SQLite database for user and message storage

## Setup

1. Install Go (1.16 or later)
2. Install dependencies:
   ```bash
   go mod download
   ```
3. Set up environment variables (see `.env.example` or create a `.env` file):
   ```
   GOOGLE_CLIENT_ID=your_client_id
   GOOGLE_CLIENT_SECRET=your_client_secret
   DEBUG=true
   ENV=development
   ```
4. Run the application:
   ```bash
   go run main.go
   ```

## Potential Enhancements

- **Modularize Code**: Split `main.go` into smaller packages (e.g., `handlers`, `models`, `websocket`).
- **Use an ORM**: Replace raw SQL with an ORM like GORM for better maintainability.
- **Add Tests**: Implement unit and integration tests.
- **Improve Error Handling**: Use custom error types and better logging.
- **Add Middleware**: Implement middleware for logging, authentication, and rate limiting.
- **Use Environment Variables**: Move hardcoded values (e.g., session key) to environment variables.
- **Add Documentation**: Use godoc comments for better code documentation.