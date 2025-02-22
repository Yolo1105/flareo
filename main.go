package main

import (
	"ModuleX/internal/layout"

	"github.com/labstack/echo/v4"
)

func main() {
	e := echo.New()
	e.Static("/static", "internal/static")
	e.GET("/", func(c echo.Context) error {
		return layout.Home(c)
	})
	e.GET("/country/:country", func(c echo.Context) error {
		return layout.CountryDetails(c)
	})
	e.GET("/search/countries", func(c echo.Context) error {return layout.CountrySearch(c)})
	e.Logger.Fatal(e.Start(":8080"))
}
