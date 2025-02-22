package layout

import (
	"ModuleX/internal/views"
	"context"
	"net/http"

	"github.com/labstack/echo/v4"
)

func Ecommerce(c echo.Context) error {
	country := c.Param("country")
	valid, err := validateCountry(country)
	if err != nil {
		return c.String(http.StatusInternalServerError, "Error validating country")
	}
	if !valid {
		return views.CountryNotFound().Render(context.Background(), c.Response().Writer)
	}
	return views.Ecommerce(country).Render(context.Background(), c.Response().Writer)
}

func validateCountry(name string) (bool, error) {
	resp, err := http.Get("https://restcountries.com/v3.1/name/" + name + "?fullText=true")
	if err != nil {
		return false, err
	}
	defer resp.Body.Close()

	if resp.StatusCode == 404 {
		return false, nil
	}

	return true, nil
}

