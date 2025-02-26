document.addEventListener("DOMContentLoaded", function () {
  // Enable Bootstrap form validation
  var forms = document.querySelectorAll(".needs-validation");

  Array.prototype.slice.call(forms).forEach(function (form) {
    form.addEventListener(
      "submit",
      function (event) {
        if (!form.checkValidity()) {
          event.preventDefault();
          event.stopPropagation();
        }

        form.classList.add("was-validated");
      },
      false
    );
  });

  // Initialize tooltips everywhere
  var tooltipTriggerList = [].slice.call(
    document.querySelectorAll('[data-bs-toggle="tooltip"]')
  );
  var tooltipList = tooltipTriggerList.map(function (tooltipTriggerEl) {
    return new bootstrap.Tooltip(tooltipTriggerEl);
  });

  // Initialize popovers
  var popoverTriggerList = [].slice.call(
    document.querySelectorAll('[data-bs-toggle="popover"]')
  );
  var popoverList = popoverTriggerList.map(function (popoverTriggerEl) {
    return new bootstrap.Popover(popoverTriggerEl);
  });
});

// Auto-calculate total price when product and quantity are selected
document.addEventListener("htmx:afterSwap", function (evt) {
  const productSelect = document.getElementById("productName");
  const quantityInput = document.getElementById("quantity");
  const totalPriceInput = document.getElementById("totalPrice");

  if (productSelect && quantityInput && totalPriceInput) {
    const updateTotalPrice = function () {
      const selectedOption = productSelect.options[productSelect.selectedIndex];
      if (selectedOption && selectedOption.value) {
        // Try to get price from data attribute first
        let price = selectedOption.dataset.price;

        // If not available, try to parse from text
        if (!price) {
          const priceMatch = selectedOption.text.match(/\$([0-9.]+)/);
          if (priceMatch && priceMatch[1]) {
            price = priceMatch[1];
          }
        }

        if (price) {
          const quantity = parseInt(quantityInput.value) || 0;
          const total = (parseFloat(price) * quantity).toFixed(2);
          totalPriceInput.value = total;
        }
      }
    };

    productSelect.addEventListener("change", updateTotalPrice);
    quantityInput.addEventListener("input", updateTotalPrice);

    // Initialize on load
    updateTotalPrice();
  }
});

// Toggle mobile navigation
document.addEventListener("DOMContentLoaded", function () {
  const navbarToggler = document.querySelector(".navbar-toggler");
  if (navbarToggler) {
    navbarToggler.addEventListener("click", function () {
      const target = document.querySelector(
        this.getAttribute("data-bs-target")
      );
      if (target) {
        target.classList.toggle("show");
      }
    });
  }
});

// Highlight current page in navigation
document.addEventListener("DOMContentLoaded", function () {
  const currentPath = window.location.pathname;
  const navLinks = document.querySelectorAll(".nav-link");

  navLinks.forEach((link) => {
    if (currentPath.includes(link.getAttribute("href"))) {
      link.classList.add("active");
    }
  });
});

// Confirm before destructive actions
document.addEventListener("htmx:confirm", function (evt) {
  // You can replace the default confirmation with a custom modal if desired
  // For now, we'll just use the browser's confirm dialog
});

// Refresh data periodically for real-time updates
document.addEventListener("DOMContentLoaded", function () {
  // Auto-refresh orders page every 2 minutes if on orders page
  if (window.location.pathname.includes("/orders")) {
    setInterval(function () {
      const ordersTable = document.getElementById("orders-table-container");
      if (ordersTable) {
        const refreshEvent = new CustomEvent("refresh");
        ordersTable.dispatchEvent(refreshEvent);
      }
    }, 120000); // 2 minutes
  }
});
