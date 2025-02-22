package main

import (
	"ModuleX/internal/components"

	"github.com/labstack/echo/v4"
)

func main() {
	e := echo.New()
	e.Static("/static", "internal/static")
	e.GET("/", func(c echo.Context) error {
		return components.Home(c)
	})
	e.GET("/country", func(c echo.Context) error {
		return components.CountryDetails(c)
	})
	e.GET("/search/countries", func(c echo.Context) error {return components.CountrySearch(c)})
	e.Logger.Fatal(e.Start(":8080"))
}
