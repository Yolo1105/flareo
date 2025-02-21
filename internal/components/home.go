package components

import (
	"ModuleX/internal/views"
	"context"

	"github.com/labstack/echo/v4"
)

func Home(c echo.Context) error {
	return views.Home().Render(context.Background(), c.Response().Writer)
}

func CountrySearch(c echo.Context) error {
	query := c.QueryParam("search")
	return views.CountrySearchList([]string{query}).Render(context.Background(), c.Response().Writer)
}

