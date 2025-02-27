package layout

import (
    "net/http"
    "github.com/labstack/echo/v4"
)

// Handles search functionality
func HandleSearch(c echo.Context) error {
    return c.String(http.StatusOK, "Search is not implemented yet.")
}

// Handles home page rendering
func Home(c echo.Context) error {
    return c.String(http.StatusOK, "Welcome to the Home page!")
}
