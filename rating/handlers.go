package main

import (
	"fmt"
	"html/template"
	"log"
	"net/http"
	"path/filepath"
	"strconv"
)

var templates map[string]*template.Template

// loadTemplates loads all HTML templates with required functions
func loadTemplates() error {
	templates = make(map[string]*template.Template)

	// Define template functions
	funcMap := template.FuncMap{
		"add":         add,
		"sub":         sub,
		"percentage":  percentage,
		"formatMoney": formatMoney,
		"range_int":   rangeInt,
	}

	// Get all partials first
	partialFiles, err := filepath.Glob("templates/partials/*.html")
	if err != nil {
		return fmt.Errorf("error finding partials: %v", err)
	}

	// Main templates
	mainTemplates := []string{"products.html", "orders.html", "seller_rating.html"}

	for _, tmpl := range mainTemplates {
		// Start with the layout and main template
		files := []string{
			filepath.Join("templates", "layout.html"),
			filepath.Join("templates", tmpl),
		}

		// Add all partials
		files = append(files, partialFiles...)

		// Parse all files together
		t, err := template.New(tmpl).Funcs(funcMap).ParseFiles(files...)
		if err != nil {
			return fmt.Errorf("error parsing template %s: %v", tmpl, err)
		}

		templates[tmpl] = t
	}

	return nil
}

// renderTemplate renders a template with data
func renderTemplate(w http.ResponseWriter, tmpl string, data map[string]interface{}) {
	t, ok := templates[tmpl]
	if !ok {
		http.Error(w, "Template not found: "+tmpl, http.StatusInternalServerError)
		return
	}

	err := t.ExecuteTemplate(w, "layout.html", data)
	if err != nil {
		http.Error(w, "Template execution error: "+err.Error(), http.StatusInternalServerError)
		log.Printf("Template error: %v", err)
	}
}

// indexHandler redirects to products page by default
func indexHandler(w http.ResponseWriter, r *http.Request) {
	http.Redirect(w, r, "/products", http.StatusSeeOther)
}

// productsHandler displays the products page
func productsHandler(w http.ResponseWriter, r *http.Request) {
	page := 1
	if pageParam := r.URL.Query().Get("page"); pageParam != "" {
		var err error
		page, err = strconv.Atoi(pageParam)
		if err != nil || page < 1 {
			page = 1
		}
	}

	products, err := db.GetProducts(page, 10)
	if err != nil {
		http.Error(w, "Error getting products: "+err.Error(), http.StatusInternalServerError)
		return
	}

	totalProducts, err := db.CountProducts()
	if err != nil {
		http.Error(w, "Error counting products: "+err.Error(), http.StatusInternalServerError)
		return
	}

	pagination := NewPaginationInfo(page, totalProducts, 10)

	data := map[string]interface{}{
		"Title":          "Product Inventory",
		"Active":         "products",
		"Products":       products,
		"PaginationInfo": pagination,
	}

	renderTemplate(w, "products.html", data)
}

// ordersHandler displays the orders page
func ordersHandler(w http.ResponseWriter, r *http.Request) {
	page := 1
	if pageParam := r.URL.Query().Get("page"); pageParam != "" {
		var err error
		page, err = strconv.Atoi(pageParam)
		if err != nil || page < 1 {
			page = 1
		}
	}

	orders, err := db.GetOrders(page, 10)
	if err != nil {
		http.Error(w, "Error getting orders: "+err.Error(), http.StatusInternalServerError)
		return
	}

	totalOrders, err := db.CountOrders()
	if err != nil {
		http.Error(w, "Error counting orders: "+err.Error(), http.StatusInternalServerError)
		return
	}

	pagination := NewPaginationInfo(page, totalOrders, 10)

	data := map[string]interface{}{
		"Title":          "Order Management",
		"Active":         "orders",
		"Orders":         orders,
		"PaginationInfo": pagination,
	}

	renderTemplate(w, "orders.html", data)
}

// ratingsHandler displays the seller rating page
func ratingsHandler(w http.ResponseWriter, r *http.Request) {
	page := 1
	if pageParam := r.URL.Query().Get("page"); pageParam != "" {
		var err error
		page, err = strconv.Atoi(pageParam)
		if err != nil || page < 1 {
			page = 1
		}
	}

	ratings, err := db.GetRatings(page, 5)
	if err != nil {
		http.Error(w, "Error getting ratings: "+err.Error(), http.StatusInternalServerError)
		return
	}

	totalRatings, err := db.CountRatings()
	if err != nil {
		http.Error(w, "Error counting ratings: "+err.Error(), http.StatusInternalServerError)
		return
	}

	stats, err := db.GetSellerStats()
	if err != nil {
		http.Error(w, "Error getting seller stats: "+err.Error(), http.StatusInternalServerError)
		return
	}

	pagination := NewPaginationInfo(page, totalRatings, 5)

	data := map[string]interface{}{
		"Title":              "Seller Ratings",
		"Active":             "ratings",
		"RecentFeedback":     ratings,
		"PaginationInfo":     pagination,
		"OverallRating":      stats.OverallRating,
		"TotalRatings":       stats.TotalRatings,
		"TotalSales":         stats.TotalSales,
		"TotalRevenue":       stats.TotalRevenue,
		"ResponseRate":       stats.ResponseRate,
		"AvgResponseTime":    stats.AvgResponseTime,
		"RatingDistribution": stats.RatingDistribution,
		"StarRange":          []int{1, 2, 3, 4, 5},
	}

	renderTemplate(w, "seller_rating.html", data)
}

// Product handlers
func productFormHandler(w http.ResponseWriter, r *http.Request) {
	// For now, just respond with placeholder text
	fmt.Fprintln(w, "Product form handler - implement real functionality")
}

func productDetailHandler(w http.ResponseWriter, r *http.Request) {
	// For now, just respond with placeholder text
	fmt.Fprintln(w, "Product detail handler - implement real functionality")
}

func productFilterHandler(w http.ResponseWriter, r *http.Request) {
	// For now, just respond with placeholder text
	fmt.Fprintln(w, "Product filter handler - implement real functionality")
}

func productSearchHandler(w http.ResponseWriter, r *http.Request) {
	// For now, just respond with placeholder text
	fmt.Fprintln(w, "Product search handler - implement real functionality")
}

// Order handlers
func orderFormHandler(w http.ResponseWriter, r *http.Request) {
	// For now, just respond with placeholder text
	fmt.Fprintln(w, "Order form handler - implement real functionality")
}

func orderDetailHandler(w http.ResponseWriter, r *http.Request) {
	// For now, just respond with placeholder text
	fmt.Fprintln(w, "Order detail handler - implement real functionality")
}

func orderFilterHandler(w http.ResponseWriter, r *http.Request) {
	// For now, just respond with placeholder text
	fmt.Fprintln(w, "Order filter handler - implement real functionality")
}

func orderSearchHandler(w http.ResponseWriter, r *http.Request) {
	// For now, just respond with placeholder text
	fmt.Fprintln(w, "Order search handler - implement real functionality")
}

// Rating handlers
func ratingFilterHandler(w http.ResponseWriter, r *http.Request) {
	// For now, just respond with placeholder text
	fmt.Fprintln(w, "Rating filter handler - implement real functionality")
}

func ratingRespondHandler(w http.ResponseWriter, r *http.Request) {
	// For now, just respond with placeholder text
	fmt.Fprintln(w, "Rating respond handler - implement real functionality")
}
