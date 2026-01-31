// ============================================
// STATE MANAGEMENT
// ============================================
let products = [];
let filteredProducts = [];
let currentPage = 1;
let pageSize = 10;
let sortOrder = {
  price: null,  // null, 'asc', 'desc'
  title: null
};
let currentSortField = null;

// ============================================
// INITIALIZATION
// ============================================
document.addEventListener('DOMContentLoaded', () => {
  getAll();
  initializeEventListeners();
});

// ============================================
// EVENT LISTENERS
// ============================================
function initializeEventListeners() {
  // Search input
  const searchInput = document.getElementById("search");
  searchInput.addEventListener("input", handleSearch);

  // Clear search button
  document.getElementById("clearSearch").addEventListener("click", clearSearch);

  // Page size selector
  document.getElementById("pageSize").addEventListener("change", handlePageSizeChange);

  // Keyboard navigation
  document.addEventListener('keydown', handleKeyboardNavigation);
}

// ============================================
// API: GET ALL PRODUCTS
// ============================================
async function getAll() {
  try {
    showLoading();
    hideError();

    const response = await fetch("https://api.escuelajs.co/api/v1/products");
    
    if (!response.ok) {
      throw new Error(`HTTP Error: ${response.status}`);
    }

    products = await response.json();
    filteredProducts = [...products];
    
    hideLoading();
    showMainContent();
    updateStats();
    renderTable();
    
  } catch (error) {
    console.error("Error fetching products:", error);
    hideLoading();
    showError(error.message || "Không thể tải dữ liệu. Vui lòng thử lại.");
  }
}

// ============================================
// UI STATE MANAGEMENT
// ============================================
function showLoading() {
  document.getElementById("loading").style.display = "block";
  document.getElementById("mainContent").style.display = "none";
  document.getElementById("error").style.display = "none";
}

function hideLoading() {
  document.getElementById("loading").style.display = "none";
}

function showMainContent() {
  document.getElementById("mainContent").style.display = "block";
}

function showError(message) {
  document.getElementById("error").style.display = "block";
  document.getElementById("errorMessage").textContent = message;
  document.getElementById("mainContent").style.display = "none";
}

function hideError() {
  document.getElementById("error").style.display = "none";
}

// ============================================
// STATISTICS UPDATE
// ============================================
function updateStats() {
  document.getElementById("totalProducts").textContent = products.length;
  document.getElementById("displayedProducts").textContent = filteredProducts.length;
  document.getElementById("currentPageStat").textContent = currentPage;
}

// ============================================
// RENDER TABLE
// ============================================
function renderTable() {
  const tbody = document.getElementById("tableBody");
  const emptyState = document.getElementById("emptyState");
  
  tbody.innerHTML = "";

  // Check if there are products to display
  if (filteredProducts.length === 0) {
    emptyState.style.display = "block";
    updatePaginationInfo();
    updatePaginationButtons();
    return;
  } else {
    emptyState.style.display = "none";
  }

  // Calculate pagination
  const start = (currentPage - 1) * pageSize;
  const end = start + pageSize;
  const pageData = filteredProducts.slice(start, end);

  // Render rows
  pageData.forEach((product, index) => {
    const tr = document.createElement("tr");
    tr.className = "fade-in";
    tr.style.animationDelay = `${index * 0.05}s`;
    
    // Clean image URL
    const imageUrl = cleanImageUrl(product.images[0]);
    
    // Truncate description
    const description = product.description 
      ? (product.description.length > 100 
          ? product.description.substring(0, 100) + "..." 
          : product.description)
      : "Không có mô tả";

    tr.innerHTML = `
      <td class="text-center">${product.id}</td>
      <td class="text-center">
        <img 
          src="${imageUrl}" 
          alt="${product.title}"
          onerror="this.src='https://via.placeholder.com/80?text=No+Image'"
          loading="lazy"
        />
      </td>
      <td class="product-title">${highlightSearchTerm(product.title)}</td>
      <td class="text-center product-price">$${product.price.toFixed(2)}</td>
      <td class="text-center">
        <span class="category-badge">
          ${product.category?.name || 'N/A'}
        </span>
      </td>
      <td class="product-desc">${description}</td>
    `;
    
    tbody.appendChild(tr);
  });

  updatePaginationInfo();
  updatePaginationButtons();
  renderPageNumbers();
  updateStats();
}

// ============================================
// HELPER FUNCTIONS
// ============================================
function cleanImageUrl(url) {
  if (!url) return 'https://via.placeholder.com/80?text=No+Image';
  
  // Remove brackets and quotes that sometimes appear in the API data
  return url.replace(/[\[\]"]/g, '').trim();
}

function highlightSearchTerm(text) {
  const searchTerm = document.getElementById("search").value.trim();
  if (!searchTerm) return text;
  
  const regex = new RegExp(`(${searchTerm})`, 'gi');
  return text.replace(regex, '<mark>$1</mark>');
}

// ============================================
// SEARCH FUNCTIONALITY
// ============================================
function handleSearch(e) {
  const keyword = e.target.value.toLowerCase().trim();
  const clearBtn = document.getElementById("clearSearch");
  
  // Show/hide clear button
  clearBtn.style.display = keyword ? "block" : "none";
  
  // Filter products
  filteredProducts = products.filter(p =>
    p.title.toLowerCase().includes(keyword)
  );
  
  currentPage = 1;
  renderTable();
}

function clearSearch() {
  document.getElementById("search").value = "";
  document.getElementById("clearSearch").style.display = "none";
  filteredProducts = [...products];
  currentPage = 1;
  renderTable();
}

// ============================================
// PAGE SIZE CHANGE
// ============================================
function handlePageSizeChange(e) {
  pageSize = Number(e.target.value);
  currentPage = 1;
  renderTable();
}

// ============================================
// PAGINATION
// ============================================
function getTotalPages() {
  return Math.ceil(filteredProducts.length / pageSize);
}

function nextPage() {
  const totalPages = getTotalPages();
  if (currentPage < totalPages) {
    currentPage++;
    renderTable();
    scrollToTop();
  }
}

function prevPage() {
  if (currentPage > 1) {
    currentPage--;
    renderTable();
    scrollToTop();
  }
}

function goToPage(page) {
  const totalPages = getTotalPages();
  if (page >= 1 && page <= totalPages) {
    currentPage = page;
    renderTable();
    scrollToTop();
  }
}

function goToLastPage() {
  currentPage = getTotalPages();
  renderTable();
  scrollToTop();
}

function updatePaginationInfo() {
  const totalPages = getTotalPages();
  const start = filteredProducts.length === 0 ? 0 : (currentPage - 1) * pageSize + 1;
  const end = Math.min(currentPage * pageSize, filteredProducts.length);
  
  document.getElementById("pageInfo").textContent = 
    `Trang ${filteredProducts.length === 0 ? 0 : currentPage} / ${totalPages || 0}`;
  
  document.getElementById("rangeInfo").textContent = 
    `Hiển thị ${start}-${end} / ${filteredProducts.length} sản phẩm`;
}

function updatePaginationButtons() {
  const totalPages = getTotalPages();
  const isFirstPage = currentPage === 1;
  const isLastPage = currentPage === totalPages;
  const noResults = filteredProducts.length === 0;
  
  // Disable/enable buttons
  document.getElementById("firstPageBtn").disabled = isFirstPage || noResults;
  document.getElementById("prevPageBtn").disabled = isFirstPage || noResults;
  document.getElementById("nextPageBtn").disabled = isLastPage || noResults;
  document.getElementById("lastPageBtn").disabled = isLastPage || noResults;
}

function renderPageNumbers() {
  const totalPages = getTotalPages();
  const pageNumbersContainer = document.getElementById("pageNumbers");
  pageNumbersContainer.innerHTML = "";
  
  if (totalPages <= 1) return;
  
  // Calculate range of page numbers to show
  let startPage = Math.max(1, currentPage - 2);
  let endPage = Math.min(totalPages, currentPage + 2);
  
  // Adjust if at the beginning or end
  if (currentPage <= 3) {
    endPage = Math.min(5, totalPages);
  }
  if (currentPage >= totalPages - 2) {
    startPage = Math.max(1, totalPages - 4);
  }
  
  // First page
  if (startPage > 1) {
    addPageNumber(1);
    if (startPage > 2) {
      addEllipsis();
    }
  }
  
  // Page numbers
  for (let i = startPage; i <= endPage; i++) {
    addPageNumber(i);
  }
  
  // Last page
  if (endPage < totalPages) {
    if (endPage < totalPages - 1) {
      addEllipsis();
    }
    addPageNumber(totalPages);
  }
}

function addPageNumber(pageNum) {
  const pageNumbersContainer = document.getElementById("pageNumbers");
  const button = document.createElement("button");
  button.className = "page-number" + (pageNum === currentPage ? " active" : "");
  button.textContent = pageNum;
  button.onclick = () => goToPage(pageNum);
  pageNumbersContainer.appendChild(button);
}

function addEllipsis() {
  const pageNumbersContainer = document.getElementById("pageNumbers");
  const span = document.createElement("span");
  span.className = "page-ellipsis";
  span.textContent = "...";
  pageNumbersContainer.appendChild(span);
}

// ============================================
// SORTING
// ============================================
function sortBy(field) {
  // Toggle sort order
  if (currentSortField === field) {
    // Cycle through: asc -> desc -> null
    if (sortOrder[field] === 'asc') {
      sortOrder[field] = 'desc';
    } else if (sortOrder[field] === 'desc') {
      sortOrder[field] = null;
      currentSortField = null;
    } else {
      sortOrder[field] = 'asc';
    }
  } else {
    // Reset previous field
    if (currentSortField) {
      sortOrder[currentSortField] = null;
    }
    currentSortField = field;
    sortOrder[field] = 'asc';
  }

  // Apply sorting
  if (sortOrder[field]) {
    filteredProducts.sort((a, b) => {
      if (field === 'price') {
        return sortOrder[field] === 'asc'
          ? a.price - b.price
          : b.price - a.price;
      } else if (field === 'title') {
        return sortOrder[field] === 'asc'
          ? a.title.localeCompare(b.title)
          : b.title.localeCompare(a.title);
      }
    });
  } else {
    // Reset to original order
    const searchTerm = document.getElementById("search").value.toLowerCase().trim();
    filteredProducts = products.filter(p =>
      p.title.toLowerCase().includes(searchTerm)
    );
  }

  updateSortButtons();
  renderTable();
}

function updateSortButtons() {
  // Update price button
  const priceBtn = document.getElementById("sortPriceBtn");
  const priceIcon = document.getElementById("priceSortIcon");
  
  if (sortOrder.price === 'asc') {
    priceBtn.classList.add('active');
    priceIcon.textContent = '↑';
  } else if (sortOrder.price === 'desc') {
    priceBtn.classList.add('active');
    priceIcon.textContent = '↓';
  } else {
    priceBtn.classList.remove('active');
    priceIcon.textContent = '↕';
  }

  // Update title button
  const titleBtn = document.getElementById("sortTitleBtn");
  const titleIcon = document.getElementById("titleSortIcon");
  
  if (sortOrder.title === 'asc') {
    titleBtn.classList.add('active');
    titleIcon.textContent = '↑';
  } else if (sortOrder.title === 'desc') {
    titleBtn.classList.add('active');
    titleIcon.textContent = '↓';
  } else {
    titleBtn.classList.remove('active');
    titleIcon.textContent = '↕';
  }
}

// ============================================
// RESET FILTERS
// ============================================
function resetFilters() {
  // Clear search
  document.getElementById("search").value = "";
  document.getElementById("clearSearch").style.display = "none";
  
  // Reset page size
  document.getElementById("pageSize").value = "10";
  pageSize = 10;
  
  // Reset sorting
  sortOrder.price = null;
  sortOrder.title = null;
  currentSortField = null;
  updateSortButtons();
  
  // Reset data
  filteredProducts = [...products];
  currentPage = 1;
  
  renderTable();
}

// ============================================
// KEYBOARD NAVIGATION
// ============================================
function handleKeyboardNavigation(e) {
  // Only handle if not typing in an input
  if (e.target.tagName === 'INPUT' || e.target.tagName === 'SELECT') {
    return;
  }
  
  switch(e.key) {
    case 'ArrowLeft':
      prevPage();
      break;
    case 'ArrowRight':
      nextPage();
      break;
    case 'Home':
      goToPage(1);
      break;
    case 'End':
      goToLastPage();
      break;
  }
}

// ============================================
// UTILITY FUNCTIONS
// ============================================
function scrollToTop() {
  window.scrollTo({
    top: 0,
    behavior: 'smooth'
  });
}

// ============================================
// EXPORT FOR TESTING (Optional)
// ============================================
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    getAll,
    sortBy,
    handleSearch,
    renderTable
  };
}