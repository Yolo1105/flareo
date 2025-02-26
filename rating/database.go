package main

import (
	"database/sql"
	"fmt"
	"os"
	"time"

	_ "github.com/mattn/go-sqlite3"
)

var db *Database

// Database handles database operations
type Database struct {
	db *sql.DB
}

// NewDatabase creates a new database connection
func NewDatabase(dbPath string) (*Database, error) {
	db, err := sql.Open("sqlite3", dbPath)
	if err != nil {
		return nil, fmt.Errorf("failed to open database: %v", err)
	}

	// Initialize tables
	if err := initTables(db); err != nil {
		db.Close()
		return nil, fmt.Errorf("failed to initialize tables: %v", err)
	}

	return &Database{db: db}, nil
}

// Close closes the database connection
func (d *Database) Close() error {
	return d.db.Close()
}

// initTables creates necessary tables if they don't exist
func initTables(db *sql.DB) error {
	queries := []string{
		`CREATE TABLE IF NOT EXISTS products (
			id INTEGER PRIMARY KEY AUTOINCREMENT,
			product_id TEXT NOT NULL,
			name TEXT NOT NULL,
			category TEXT NOT NULL,
			price REAL NOT NULL,
			stock_quantity INTEGER NOT NULL,
			description TEXT,
			is_active INTEGER DEFAULT 1
		)`,
		`CREATE TABLE IF NOT EXISTS orders (
			id INTEGER PRIMARY KEY AUTOINCREMENT,
			order_id TEXT NOT NULL,
			customer_name TEXT NOT NULL,
			product_name TEXT NOT NULL,
			quantity INTEGER NOT NULL,
			total_price REAL NOT NULL,
			order_date TEXT NOT NULL,
			status TEXT NOT NULL
		)`,
		`CREATE TABLE IF NOT EXISTS ratings (
			id INTEGER PRIMARY KEY AUTOINCREMENT,
			order_id TEXT NOT NULL,
			customer_name TEXT NOT NULL,
			rating INTEGER NOT NULL,
			comment TEXT,
			seller_response TEXT,
			date TEXT NOT NULL
		)`,
	}

	for _, query := range queries {
		_, err := db.Exec(query)
		if err != nil {
			return err
		}
	}

	// Add sample data if tables are empty
	if err := addSampleDataIfEmpty(db); err != nil {
		return err
	}

	return nil
}

// addSampleDataIfEmpty adds sample data if tables are empty
func addSampleDataIfEmpty(db *sql.DB) error {
	// Check if products table is empty
	var count int
	err := db.QueryRow("SELECT COUNT(*) FROM products").Scan(&count)
	if err != nil {
		return err
	}

	if count == 0 {
		// Add a single sample product to start
		_, err := db.Exec(
			"INSERT INTO products (product_id, name, category, price, stock_quantity, description, is_active) VALUES (?, ?, ?, ?, ?, ?, ?)",
			"P001", "Wireless Earbuds", "Electronics", 59.99, 25, "High-quality wireless earbuds", 1,
		)
		if err != nil {
			return err
		}
		
		// Add more sample products
		sampleProducts := [][7]interface{}{
			{"P002", "Cotton T-Shirt", "Clothing", 19.99, 100, "Comfortable cotton t-shirt", 1},
			{"P003", "Coffee Maker", "Home & Kitchen", 89.99, 15, "Programmable coffee maker", 1},
			{"P004", "Novel: The Great Adventure", "Books", 12.99, 50, "Bestselling novel", 1},
			{"P005", "Facial Cleanser", "Beauty", 24.99, 30, "Gentle facial cleanser", 1},
		}
		
		for _, p := range sampleProducts {
			_, err := db.Exec(
				"INSERT INTO products (product_id, name, category, price, stock_quantity, description, is_active) VALUES (?, ?, ?, ?, ?, ?, ?)",
				p[0], p[1], p[2], p[3], p[4], p[5], p[6],
			)
			if err != nil {
				return err
			}
		}
		
		// Add sample orders
		sampleOrders := [][7]interface{}{
			{"ORD001", "John Smith", "Wireless Earbuds", 1, 59.99, time.Now().Format("2006-01-02"), "Delivered"},
			{"ORD002", "Jane Doe", "Cotton T-Shirt", 2, 39.98, time.Now().Format("2006-01-02"), "Shipped"},
			{"ORD003", "Mike Johnson", "Coffee Maker", 1, 89.99, time.Now().Format("2006-01-02"), "Pending"},
		}
		
		for _, o := range sampleOrders {
			_, err := db.Exec(
				"INSERT INTO orders (order_id, customer_name, product_name, quantity, total_price, order_date, status) VALUES (?, ?, ?, ?, ?, ?, ?)",
				o[0], o[1], o[2], o[3], o[4], o[5], o[6],
			)
			if err != nil {
				return err
			}
		}
		
		// Add sample ratings
		sampleRatings := [][6]interface{}{
			{"ORD001", "John Smith", 5, "Great product, fast shipping!", "", time.Now().Format("2006-01-02")},
			{"ORD002", "Jane Doe", 4, "Good quality, slightly delayed shipping", "Thank you for your feedback. We apologize for the delay.", time.Now().Format("2006-01-02")},
		}
		
		for _, r := range sampleRatings {
			_, err := db.Exec(
				"INSERT INTO ratings (order_id, customer_name, rating, comment, seller_response, date) VALUES (?, ?, ?, ?, ?, ?)",
				r[0], r[1], r[2], r[3], r[4], r[5],
			)
			if err != nil {
				return err
			}
		}
	}

	return nil
}

// SellerStats contains seller performance metrics
type SellerStats struct {
	OverallRating      float64
	TotalRatings       int
	TotalSales         int
	TotalRevenue       float64
	ResponseRate       int
	AvgResponseTime    string
	RatingDistribution [5]int
}

// initDB initializes the database connection
func initDB() (*Database, error) {
	// Create data directory if it doesn't exist
	dir := "data"
	if _, err := os.Stat(dir); os.IsNotExist(err) {
		if err := os.Mkdir(dir, 0755); err != nil {
			return nil, fmt.Errorf("could not create data directory: %v", err)
		}
	}
	
	return NewDatabase("data/seller_dashboard.db")
}

// GetProducts retrieves products with pagination
func (d *Database) GetProducts(page, pageSize int) ([]Product, error) {
	offset := (page - 1) * pageSize
	
	rows, err := d.db.Query(`
		SELECT id, product_id, name, category, price, stock_quantity, description, is_active
		FROM products
		ORDER BY id DESC
		LIMIT ? OFFSET ?
	`, pageSize, offset)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	
	var products []Product
	for rows.Next() {
		var p Product
		var isActive int
		if err := rows.Scan(&p.ID, &p.ProductID, &p.Name, &p.Category, &p.Price, 
						   &p.StockQuantity, &p.Description, &isActive); err != nil {
			return nil, err
		}
		p.IsActive = isActive == 1
		products = append(products, p)
	}
	
	return products, nil
}

// CountProducts counts total products
func (d *Database) CountProducts() (int, error) {
	var count int
	err := d.db.QueryRow("SELECT COUNT(*) FROM products").Scan(&count)
	return count, err
}

// GetOrders retrieves orders with pagination
func (d *Database) GetOrders(page, pageSize int) ([]Order, error) {
	offset := (page - 1) * pageSize
	
	rows, err := d.db.Query(`
		SELECT id, order_id, customer_name, product_name, quantity, total_price, order_date, status
		FROM orders
		ORDER BY order_date DESC
		LIMIT ? OFFSET ?
	`, pageSize, offset)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	
	var orders []Order
	for rows.Next() {
		var o Order
		if err := rows.Scan(&o.ID, &o.OrderID, &o.CustomerName, &o.ProductName, 
						   &o.Quantity, &o.TotalPrice, &o.OrderDate, &o.Status); err != nil {
			return nil, err
		}
		orders = append(orders, o)
	}
	
	return orders, nil
}

// CountOrders counts total orders
func (d *Database) CountOrders() (int, error) {
	var count int
	err := d.db.QueryRow("SELECT COUNT(*) FROM orders").Scan(&count)
	return count, err
}

// GetRatings retrieves ratings with pagination
func (d *Database) GetRatings(page, pageSize int) ([]Rating, error) {
	offset := (page - 1) * pageSize
	
	rows, err := d.db.Query(`
		SELECT id, order_id, customer_name, rating, comment, seller_response, date
		FROM ratings
		ORDER BY date DESC
		LIMIT ? OFFSET ?
	`, pageSize, offset)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	
	var ratings []Rating
	for rows.Next() {
		var r Rating
		if err := rows.Scan(&r.ID, &r.OrderID, &r.CustomerName, &r.Rating, 
						   &r.Comment, &r.SellerResponse, &r.Date); err != nil {
			return nil, err
		}
		ratings = append(ratings, r)
	}
	
	return ratings, nil
}

// CountRatings counts total ratings
func (d *Database) CountRatings() (int, error) {
	var count int
	err := d.db.QueryRow("SELECT COUNT(*) FROM ratings").Scan(&count)
	return count, err
}

// GetSellerStats retrieves seller statistics
func (d *Database) GetSellerStats() (SellerStats, error) {
	var stats SellerStats
	
	// Get overall rating
	err := d.db.QueryRow(`
		SELECT COALESCE(AVG(rating), 0) FROM ratings
	`).Scan(&stats.OverallRating)
	if err != nil {
		return stats, err
	}
	
	// Get total ratings
	err = d.db.QueryRow("SELECT COUNT(*) FROM ratings").Scan(&stats.TotalRatings)
	if err != nil {
		return stats, err
	}
	
	// Get total sales
	err = d.db.QueryRow("SELECT COUNT(*) FROM orders").Scan(&stats.TotalSales)
	if err != nil {
		return stats, err
	}
	
	// Get total revenue
	err = d.db.QueryRow(`
		SELECT COALESCE(SUM(total_price), 0) FROM orders
	`).Scan(&stats.TotalRevenue)
	if err != nil {
		return stats, err
	}
	
	// Calculate response rate (percentage of ratings with response)
	var respondedCount int
	err = d.db.QueryRow(`
		SELECT COUNT(*) FROM ratings WHERE seller_response IS NOT NULL AND seller_response != ''
	`).Scan(&respondedCount)
	if err != nil {
		return stats, err
	}
	
	if stats.TotalRatings > 0 {
		stats.ResponseRate = int(float64(respondedCount) / float64(stats.TotalRatings) * 100)
	}
	
	// Set average response time (this would normally come from actual data)
	stats.AvgResponseTime = "24 hours"
	
	// Get rating distribution (count of each star rating 1-5)
	for i := 1; i <= 5; i++ {
		err = d.db.QueryRow(`
			SELECT COUNT(*) FROM ratings WHERE rating = ?
		`, i).Scan(&stats.RatingDistribution[i-1])
		if err != nil {
			return stats, err
		}
	}
	
	return stats, nil
}
