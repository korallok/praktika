const productsState = {
  categories: [],
  products: [],
  editingProductId: null,
  search: ""
};

document.addEventListener("DOMContentLoaded", async () => {
  bindProductEvents();

  try {
    await Promise.all([loadCategories(), loadProducts()]);
  } catch (error) {
    FreshMart.showAlert(error.message, "error");
  }
});

function bindProductEvents() {
  document.getElementById("productForm").addEventListener("submit", handleProductSubmit);
  document.getElementById("searchForm").addEventListener("submit", handleSearch);
  document.getElementById("resetSearchButton").addEventListener("click", resetSearch);
  document.getElementById("cancelEditButton").addEventListener("click", resetProductForm);
  document.getElementById("productsTableBody").addEventListener("click", handleTableActions);
}

async function loadCategories() {
  productsState.categories = await FreshMart.request("/api/categories");
  const select = document.getElementById("productCategory");

  select.innerHTML = productsState.categories
    .map((category) => `<option value="${category.id}">${category.name}</option>`)
    .join("");
}

async function loadProducts() {
  const query = productsState.search ? `?search=${encodeURIComponent(productsState.search)}` : "";
  productsState.products = await FreshMart.request(`/api/products${query}`);
  renderProductsTable();
}

function renderProductsTable() {
  const tableBody = document.getElementById("productsTableBody");

  if (!productsState.products.length) {
    tableBody.innerHTML = FreshMart.createEmptyRow("Товары не найдены.", 5);
    return;
  }

  tableBody.innerHTML = productsState.products
    .map(
      (product) => `
        <tr>
          <td>${product.name}</td>
          <td>${product.categoryName}</td>
          <td>${FreshMart.formatCurrency(product.price)}</td>
          <td>${product.quantity} шт.</td>
          <td>
            <div class="table-actions">
              <button class="table-button" type="button" data-action="edit" data-id="${product.id}">
                Изменить
              </button>
              <button
                class="table-button danger"
                type="button"
                data-action="delete"
                data-id="${product.id}"
              >
                Удалить
              </button>
            </div>
          </td>
        </tr>
      `
    )
    .join("");
}

async function handleProductSubmit(event) {
  event.preventDefault();

  const form = event.currentTarget;
  const submitButton = form.querySelector('button[type="submit"]');
  const payload = {
    name: document.getElementById("productName").value.trim(),
    categoryId: document.getElementById("productCategory").value,
    price: document.getElementById("productPrice").value,
    quantity: document.getElementById("productQuantity").value
  };

  const editingId = productsState.editingProductId;
  const url = editingId ? `/api/products/${editingId}` : "/api/products";
  const method = editingId ? "PUT" : "POST";

  try {
    submitButton.disabled = true;
    const response = await FreshMart.request(url, {
      method,
      body: JSON.stringify(payload)
    });

    FreshMart.showAlert(response.message);
    resetProductForm();
    await loadProducts();
  } catch (error) {
    FreshMart.showAlert(error.message, "error");
  } finally {
    submitButton.disabled = false;
  }
}

function handleSearch(event) {
  event.preventDefault();
  productsState.search = document.getElementById("searchInput").value.trim();
  loadProducts().catch((error) => FreshMart.showAlert(error.message, "error"));
}

function resetSearch() {
  productsState.search = "";
  document.getElementById("searchInput").value = "";
  loadProducts().catch((error) => FreshMart.showAlert(error.message, "error"));
}

function handleTableActions(event) {
  const actionButton = event.target.closest("[data-action]");
  if (!actionButton) {
    return;
  }

  const productId = Number(actionButton.dataset.id);
  const product = productsState.products.find((item) => item.id === productId);

  if (!product) {
    return;
  }

  if (actionButton.dataset.action === "edit") {
    fillProductForm(product);
    return;
  }

  if (actionButton.dataset.action === "delete") {
    handleDeleteProduct(productId);
  }
}

function fillProductForm(product) {
  productsState.editingProductId = product.id;
  document.getElementById("productId").value = product.id;
  document.getElementById("productName").value = product.name;
  document.getElementById("productCategory").value = product.categoryId;
  document.getElementById("productPrice").value = product.price;
  document.getElementById("productQuantity").value = product.quantity;
  document.getElementById("productFormTitle").textContent = "Редактирование товара";
  document.getElementById("cancelEditButton").classList.remove("hidden");
}

async function handleDeleteProduct(productId) {
  const confirmed = window.confirm("Удалить товар из списка?");
  if (!confirmed) {
    return;
  }

  try {
    const response = await FreshMart.request(`/api/products/${productId}`, {
      method: "DELETE"
    });

    FreshMart.showAlert(response.message);
    if (productsState.editingProductId === productId) {
      resetProductForm();
    }
    await loadProducts();
  } catch (error) {
    FreshMart.showAlert(error.message, "error");
  }
}

function resetProductForm() {
  productsState.editingProductId = null;
  document.getElementById("productForm").reset();
  document.getElementById("productFormTitle").textContent = "Добавление товара";
  document.getElementById("cancelEditButton").classList.add("hidden");

  if (productsState.categories.length) {
    document.getElementById("productCategory").value = productsState.categories[0].id;
  }
}
