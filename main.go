package main

import (
	"ModuleX/internal/layout"

	"github.com/labstack/echo/v4"
)

// main initializes and starts the web server with all route handlers
func main() {
	e := echo.New()
	// Serve static files from internal/static directory
	e.Static("/static", "internal/static")

	// Root route handler - serves home page or handles search redirects
	e.GET("/", func(c echo.Context) error {
		if c.QueryParam("search") != "" {
			return layout.HandleSearch(c)
		}
		return layout.Home(c)
	})

	// Country details page route handler
	e.GET("/country/:country", func(c echo.Context) error {
		return layout.Ecommerce(c)
	})

	// Autocomplete search API endpoint
	e.GET("/search/countries", func(c echo.Context) error {
		return layout.CountrySearchAutocomplete(c)
	})

	// Start the server on port 8080
	e.Logger.Fatal(e.Start(":8080"))
}
