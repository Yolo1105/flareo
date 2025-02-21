package components

import (
	"ModuleX/internal/views"
	"context"

	"github.com/labstack/echo/v4"
)

func Hello(c echo.Context) error {
	return views.Hello("BING BING").Render(context.Background(), c.Response().Writer)
}