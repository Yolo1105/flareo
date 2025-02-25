# TravelX Application Documentation

## Overview
TravelX is a web application that enables users to search for country-specific travel experiences. The application leverages HTMX to provide live search autocomplete functionality and utilizes the REST Countries API to fetch and validate country data.

## Directory Structure and File Functionality

### main.go
- **Description:** Initializes and starts the web server using the Echo framework.
- **Routes:**
  - **GET "/"**  
    - Serves the home page when no search query is provided.
    - If a search query (parameter `search`) is present, it triggers the search logic.
  - **GET "/country/:country"**  
    - Renders the details page for a specific country.
    - Also checks for a search query to potentially trigger the search functionality.
  - **GET "/search/countries"**  
    - Serves as an autocomplete endpoint for country suggestions; this endpoint is used by HTMX in the frontend.
- **HTMX-related features:**  
  The home and country detail pages include search forms with HTMX attributes (such as `hx-get`, `hx-trigger`, and `hx-target`) to enable live search suggestions without full-page refreshes.

### internal/views/home.templ
- **Description:** Provides template definitions for:
  - **`Home()`**  
    Renders the landing page with a search input that uses HTMX to fetch live autocomplete suggestions.
  - **`CountrySearchList()`**  
    Renders a dropdown list of matching country names. The first result is highlighted for keyboard navigation.
  - **`CountryNotFound()`**  
    Renders an error page when no matching country is found.
- **HTMX-related features:**  
  The search form in `Home()` uses attributes like:
  - `hx-get="/search/countries"`: Specifies the URL to fetch suggestions.
  - `hx-trigger="input delay:300ms from:input"`: Triggers the autocomplete only after user input with a slight delay.
  - `hx-target="#location_autocomplete"`: Updates the autocomplete dropdown element with the results.

### internal/views/ecommerce.templ
- **Description:** Contains the template for the country details (ecommerce) page.
- **Content includes:**
  - A header with an integrated HTMX-enabled search form.
  - Sections for "Popular Services" and "All Services" that display country-specific offerings.
  - Integration of external assets (e.g., Font Awesome for icons, Tailwind CSS utilities).
- **HTMX-related features:**  
  The header search form uses HTMX attributes similar to the home page, allowing users to quickly search for another country.

### internal/layout/countrySearch.go
- **Description:** Handles the search functionality.
- **Functions:**
  - **`HandleSearch`**  
    Processes search form submissions. It uses the REST Countries API to find matching country names; if a match is found, it redirects to the corresponding country detail page, otherwise it renders the "Country Not Found" page.
  - **`CountrySearchAutocomplete`**  
    Serves as the autocomplete API endpoint. It returns up to 5 matching country names (fetched from the REST Countries API) and renders them using the `CountrySearchList` template.
- **Notes:**  
  These functions are critical for powering the HTMX live search experience in the application.

### internal/layout/ecommerce.go
- **Description:** Manages the country detail page route.
- **Function:**
  - **`Ecommerce`**  
    Validates that the requested country exists by querying the REST Countries API (using full-text search). If validation succeeds, it renders the country detail page via the `Ecommerce` template. Otherwise, it displays the "Country Not Found" page.
- **Notes:**  
  This extra validation step ensures that only valid country names are displayed.

### internal/layout/home.go
- **Description:** Handles rendering of the home (landing) page.
- **Function:**
  - **`Home`**  
    Renders the main landing page using the `Home()` template defined in the views.

## HTMX Integration Across the Application
- **Usage in Templates:**  
  Both `Home()` and the header in the `Ecommerce` template include search forms that use HTMX attributes to provide live autocomplete suggestions.
  - `hx-get`: Calls the `/search/countries` endpoint.
  - `hx-trigger`: Listens for input events (with a delay) before making a request.
  - `hx-target`: Specifies the element in the DOM (typically an unordered list) where the search suggestions are rendered.
- **Benefits:**  
  This approach eliminates the need for full-page reloads while providing a smooth and dynamic user experience during search.

## Additional Notes
- The application interacts with an external REST Countries API to ensure accurate country data.
- Error handling is in place to gracefully show a dedicated "Country Not Found" page whenever a search query does not yield results.
