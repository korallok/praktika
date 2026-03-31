const salesState = {
  products: [],
  sales: [],
  currentItems: [],
  nextItemId: 1
};

document.addEventListener("DOMContentLoaded", async () => {
  bindSalesEvents();

  try {
    await Promise.all([loadSaleProducts(), loadSales()]);
    addSaleItem();
  } catch (error) {
    FreshMart.showAlert(error.message, "error");
  }
});

function bindSalesEvents() {
  document.getElementById("addSaleItemButton").addEventListener("click", addSaleItem);
  document.getElementById("saleForm").addEventListener("submit", handleSaleSubmit);
  document.getElementById("saleItemsContainer").addEventListener("click", handleSaleItemActions);
  document.getElementById("saleItemsContainer").addEventListener("change", handleSaleItemChange);
  document.getElementById("saleItemsContainer").addEventListener("input", handleSaleItemChange);
}

async function loadSaleProducts() {
  salesState.products = await FreshMart.request("/api/products");
}

async function loadSales() {
  salesState.sales = await FreshMart.request("/api/sales");
  renderSalesTable();
}

function addSaleItem() {
  salesState.currentItems.push({
    uid: salesState.nextItemId++,
    productId: salesState.products[0]?.id || "",
    quantity: 1
  });

  renderSaleItems();
}

function renderSaleItems() {
  const container = document.getElementById("saleItemsContainer");

  if (!salesState.currentItems.length) {
    container.innerHTML = '<div class="empty-state">Добавьте позицию в продажу.</div>';
    updatePreviewTotal();
    return;
  }

  container.innerHTML = salesState.currentItems
    .map((item) => {
      const options = salesState.products
        .map(
          (product) => `
            <option value="${product.id}" ${Number(item.productId) === product.id ? "selected" : ""}>
              ${product.name} (${product.quantity} шт. на складе)
            </option>
          `
        )
        .join("");

      return `
        <div class="sale-item" data-uid="${item.uid}">
          <label class="form-field">
            <span>Товар</span>
            <select data-field="productId">${options}</select>
          </label>

          <label class="form-field">
            <span>Количество</span>
            <input data-field="quantity" type="number" min="1" step="1" value="${item.quantity}" />
          </label>

          <button class="ghost-button" type="button" data-action="remove-sale-item">
            Удалить
          </button>
        </div>
      `;
    })
    .join("");

  updatePreviewTotal();
}

function handleSaleItemActions(event) {
  const button = event.target.closest('[data-action="remove-sale-item"]');
  if (!button) {
    return;
  }

  const itemElement = button.closest("[data-uid]");
  const uid = Number(itemElement.dataset.uid);

  salesState.currentItems = salesState.currentItems.filter((item) => item.uid !== uid);
  renderSaleItems();
}

function handleSaleItemChange(event) {
  const field = event.target.dataset.field;
  if (!field) {
    return;
  }

  const itemElement = event.target.closest("[data-uid]");
  const uid = Number(itemElement.dataset.uid);
  const item = salesState.currentItems.find((currentItem) => currentItem.uid === uid);

  if (!item) {
    return;
  }

  if (field === "productId") {
    item.productId = Number(event.target.value);
  }

  if (field === "quantity") {
    item.quantity = Math.max(1, Number(event.target.value) || 1);
    event.target.value = item.quantity;
  }

  updatePreviewTotal();
}

function updatePreviewTotal() {
  const total = salesState.currentItems.reduce((sum, item) => {
    const product = salesState.products.find((productRow) => productRow.id === Number(item.productId));
    if (!product) {
      return sum;
    }

    return sum + Number(product.price) * Number(item.quantity);
  }, 0);

  document.getElementById("saleTotalPreview").textContent = FreshMart.formatCurrency(total);
}

async function handleSaleSubmit(event) {
  event.preventDefault();

  if (!salesState.currentItems.length) {
    FreshMart.showAlert("Добавьте хотя бы одну позицию.", "error");
    return;
  }

  const submitButton = event.currentTarget.querySelector('button[type="submit"]');
  const payload = {
    items: salesState.currentItems.map((item) => ({
      productId: item.productId,
      quantity: item.quantity
    }))
  };

  try {
    submitButton.disabled = true;
    const response = await FreshMart.request("/api/sales", {
      method: "POST",
      body: JSON.stringify(payload)
    });

    FreshMart.showAlert(response.message);
    await Promise.all([loadSaleProducts(), loadSales()]);
    salesState.currentItems = [];
    addSaleItem();
  } catch (error) {
    FreshMart.showAlert(error.message, "error");
  } finally {
    submitButton.disabled = false;
  }
}

function renderSalesTable() {
  const tableBody = document.getElementById("salesTableBody");

  if (!salesState.sales.length) {
    tableBody.innerHTML = FreshMart.createEmptyRow("Продажи пока отсутствуют.", 4);
    return;
  }

  tableBody.innerHTML = salesState.sales
    .map(
      (sale) => `
        <tr>
          <td>${FreshMart.formatDate(sale.saleDate)}</td>
          <td>${sale.username}</td>
          <td>${sale.itemSummary || "Без позиций"}</td>
          <td>${FreshMart.formatCurrency(sale.totalAmount)}</td>
        </tr>
      `
    )
    .join("");
}
