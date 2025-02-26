package main

import (
	"fmt"
	"math"
)

// Template helper functions
func add(a, b int) int {
	return a + b
}

func sub(a, b int) int {
	return a - b
}

func percentage(count, total int) int {
	if total == 0 {
		return 0
	}
	return int(math.Round(float64(count) / float64(total) * 100))
}

func formatMoney(amount float64) string {
	return fmt.Sprintf("$%.2f", amount)
}

func rangeInt(start, end int) []int {
	var result []int
	for i := start; i <= end; i++ {
		result = append(result, i)
	}
	return result
}

// PaginationInfo provides pagination data for templates
type PaginationInfo struct {
	CurrentPage  int
	TotalPages   int
	TotalItems   int
	ItemsPerPage int
	StartItem    int
	EndItem      int
	Pages        []int
}

// NewPaginationInfo creates a new pagination info struct
func NewPaginationInfo(currentPage, totalItems, itemsPerPage int) PaginationInfo {
	if currentPage < 1 {
		currentPage = 1
	}
	
	totalPages := int(math.Ceil(float64(totalItems) / float64(itemsPerPage)))
	if totalPages < 1 {
		totalPages = 1
	}
	
	if currentPage > totalPages {
		currentPage = totalPages
	}
	
	startItem := (currentPage - 1) * itemsPerPage + 1
	if startItem > totalItems {
		startItem = totalItems
	}
	
	endItem := startItem + itemsPerPage - 1
	if endItem > totalItems {
		endItem = totalItems
	}
	if totalItems == 0 {
		startItem = 0
	}
	
	// Generate page numbers to display
	var pages []int
	
	// Always show first and last page plus pages around current
	maxPagesToShow := 5
	if totalPages <= maxPagesToShow {
		// If we have fewer pages than max, show all
		for i := 1; i <= totalPages; i++ {
			pages = append(pages, i)
		}
	} else {
		// Calculate range to show around current page
		halfWindow := (maxPagesToShow - 2) / 2
		
		// Always show first page
		pages = append(pages, 1)
		
		// Calculate start and end of middle range
		rangeStart := currentPage - halfWindow
		rangeEnd := currentPage + halfWindow
		
		// Adjust range for edge cases
		if rangeStart <= 1 {
			rangeStart = 2
			rangeEnd = min(totalPages-1, maxPagesToShow-1)
		} else if rangeEnd >= totalPages {
			rangeEnd = totalPages - 1
			rangeStart = max(2, totalPages-maxPagesToShow+2)
		}
		
		// Add separator if needed
		if rangeStart > 2 {
			pages = append(pages, -1) // -1 represents ellipsis
		}
		
		// Add middle range
		for i := rangeStart; i <= rangeEnd; i++ {
			pages = append(pages, i)
		}
		
		// Add separator if needed
		if rangeEnd < totalPages-1 {
			pages = append(pages, -1) // -1 represents ellipsis
		}
		
		// Always show last page if not the same as first
		if totalPages > 1 {
			pages = append(pages, totalPages)
		}
	}
	
	return PaginationInfo{
		CurrentPage:  currentPage,
		TotalPages:   totalPages,
		TotalItems:   totalItems,
		ItemsPerPage: itemsPerPage,
		StartItem:    startItem,
		EndItem:      endItem,
		Pages:        pages,
	}
}

func min(a, b int) int {
	if a < b {
		return a
	}
	return b
}

func max(a, b int) int {
	if a > b {
		return a
	}
	return b
}
