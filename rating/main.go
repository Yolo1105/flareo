package main

import (
	"fmt"
	"log"
	"net/http"
)

func main() {
	// Initialize the database
	var err error
	db, err = initDB()
	if err != nil {
		log.Fatalf("Failed to initialize database: %v", err)
	}
	defer db.Close()

	// Load templates
	if err := loadTemplates(); err != nil {
		log.Fatalf("Failed to load templates: %v", err)
	}

	// Static files
	fs := http.FileServer(http.Dir("static"))
	http.Handle("/static/", http.StripPrefix("/static/", fs))

	// Main routes
	http.HandleFunc("/", indexHandler)
	http.HandleFunc("/orders", ordersHandler)
	http.HandleFunc("/products", productsHandler)
	http.HandleFunc("/ratings", ratingsHandler)

	// Order routes
	http.HandleFunc("/orders/new", orderFormHandler)
	http.HandleFunc("/orders/filter", orderFilterHandler)
	http.HandleFunc("/orders/search", orderSearchHandler)
	http.HandleFunc("/orders/", orderDetailHandler)

	// Product routes
	http.HandleFunc("/products/new", productFormHandler)
	http.HandleFunc("/products/filter", productFilterHandler)
	http.HandleFunc("/products/search", productSearchHandler)
	http.HandleFunc("/products/", productDetailHandler)

	// Rating routes
	http.HandleFunc("/ratings/filter", ratingFilterHandler)
	http.HandleFunc("/ratings/", ratingRespondHandler)

	fmt.Println("Server started on http://localhost:8080")
	log.Fatal(http.ListenAndServe(":8080", nil))
}
