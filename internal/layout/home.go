package layout

import (
	"ModuleX/internal/views"
	"context"

	"github.com/labstack/echo/v4"
)

// Home renders the main landing page with the country search interface
func Home(c echo.Context) error {
	return views.Home().Render(context.Background(), c.Response().Writer)
}



