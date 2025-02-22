package main

import (
	"ModuleX/internal/layout"

	"github.com/labstack/echo/v4"
)

func main() {
	e := echo.New()
	e.Static("/static", "internal/static")
	e.GET("/", func(c echo.Context) error {
		if c.QueryParam("search") != "" {
			return layout.HandleSearch(c)
		}
		return layout.Home(c)
	})
	e.GET("/country/:country", func(c echo.Context) error {
		return layout.Ecommerce(c)
	})
	e.GET("/search/countries", func(c echo.Context) error {return layout.CountrySearchAutocomplete(c)})
	e.Logger.Fatal(e.Start(":8080"))
}
