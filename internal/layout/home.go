package layout

import (
	"ModuleX/internal/views"
	"context"
	"encoding/json"
	"net/http"

	"github.com/labstack/echo/v4"
)

func Home(c echo.Context) error {
	return views.Home().Render(context.Background(), c.Response().Writer)
}

func HandleSearch(c echo.Context) error {
    // Handles enter key pressed in the input field by looking up the first country in the api with those key presses
	query := c.QueryParam("search")
	if query == "" {
		return Home(c)
	}

	// Use the existing search logic to get the first matching country
	resp, err := http.Get("https://restcountries.com/v3.1/name/" + query)
	if err != nil {
		return c.String(http.StatusInternalServerError, "Error fetching countries")
	}
	defer resp.Body.Close()

	var result []map[string]interface{}
	if err := json.NewDecoder(resp.Body).Decode(&result); err != nil {
		return c.String(http.StatusInternalServerError, "Error parsing response")
	}

	// If we found any results, redirect to the first country
	if len(result) > 0 {
		if name, ok := result[0]["name"].(map[string]interface{}); ok {
			if commonName, ok := name["common"].(string); ok {
				return c.Redirect(http.StatusFound, "/country/"+commonName)
			}
		}
	}

	// If no results found, show the not found page
	return views.CountryNotFound().Render(context.Background(), c.Response().Writer)
}

func CountrySearchAutocomplete(c echo.Context) error {
	query := c.QueryParam("search")
	if query == "" {
		return views.CountrySearchList([]string{}).Render(context.Background(), c.Response().Writer)
	}

	resp, err := http.Get("https://restcountries.com/v3.1/name/" + query)
	if err != nil {
		return c.String(http.StatusInternalServerError, "Error fetching countries")
	}
	defer resp.Body.Close()

	var result []map[string]interface{}
	if err := json.NewDecoder(resp.Body).Decode(&result); err != nil {
		return c.String(http.StatusInternalServerError, "Error parsing response")
	}

	var countries []string
	for _, country := range result {
		if name, ok := country["name"].(map[string]interface{}); ok {
			if commonName, ok := name["common"].(string); ok {
				countries = append(countries, commonName)
				if len(countries) == 5 { // append only the top 5
					break
				}
			}
		}
	}

	return views.CountrySearchList(countries).Render(context.Background(), c.Response().Writer)
}

