package layout

import (
	"ModuleX/internal/views"
	"context"
	"net/http"

	"github.com/labstack/echo/v4"
)

// Ecommerce renders the country detail page
// It first validates that the requested country exists
// Returns a 404-style page if the country is not found
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

// validateCountry checks if a given country name exists in the REST Countries API
// Returns true if the country exists, false if not found
// Returns an error if the API request fails
func validateCountry(name string) (bool, error) {
	resp, err := http.Get("https://restcountries.com/v3.1/name/" + name + "?fullText=true")
	if err != nil {
		return false, err
	}
	defer resp.Body.Close()

	if resp.StatusCode == 404 {
		return false, err
	}

	return true, err
}

