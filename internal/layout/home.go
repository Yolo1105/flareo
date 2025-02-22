package layout

import (
	"ModuleX/internal/views"
	"context"
	"encoding/json"
	"net/http"

	"github.com/labstack/echo/v4"
)

// Home renders the main landing page with the country search interface
func Home(c echo.Context) error {
	return views.Home().Render(context.Background(), c.Response().Writer)
}

// HandleSearch processes the search form submission when user hits enter
// It finds the first matching country and redirects to its detail page
// If no match is found, shows the "country not found" page
func HandleSearch(c echo.Context) error {
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

// CountrySearchAutocomplete handles the HTMX-powered live search functionality
// It returns up to 5 matching countries as the user types
// The results are rendered as a dropdown list below the search input
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

