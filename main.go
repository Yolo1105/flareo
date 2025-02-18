package main

import (
	"ModuleX/internal/views"
	"context"

	"github.com/labstack/echo/v4"
)

func main() {
	e := echo.New()
	e.Static("/static", "internal/static")
	e.GET("/", func(c echo.Context) error {
		return views.Hello("BING BING").Render(context.Background(), c.Response().Writer )
	})
	e.Logger.Fatal(e.Start(":8080"))
}