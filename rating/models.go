package main

// Product represents a product in the inventory
type Product struct {
	ID            int
	ProductID     string
	Name          string
	Category      string
	Price         float64
	StockQuantity int
	Description   string
	IsActive      bool
}

// Order represents a customer order
type Order struct {
	ID           int
	OrderID      string
	CustomerName string
	ProductName  string
	Quantity     int
	TotalPrice   float64
	OrderDate    string
	Status       string
}

// Rating represents a customer rating and feedback
type Rating struct {
	ID             int
	OrderID        string
	CustomerName   string
	Rating         int
	Comment        string
	SellerResponse string
	Date           string
}
