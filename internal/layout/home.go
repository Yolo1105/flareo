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

func CountrySearch(c echo.Context) error {
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

