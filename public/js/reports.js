document.addEventListener("DOMContentLoaded", async () => {
  try {
    const [summary, topProducts, stock] = await Promise.all([
      FreshMart.request("/api/reports/summary"),
      FreshMart.request("/api/reports/top-products"),
      FreshMart.request("/api/reports/stock")
    ]);

    document.getElementById("reportsTotalSalesCount").textContent =
      summary.totalSalesCount || 0;
    document.getElementById("reportsTotalRevenue").textContent = FreshMart.formatCurrency(
      summary.totalRevenue
    );

    renderTopProducts(topProducts);
    renderStock(stock);
  } catch (error) {
    FreshMart.showAlert(error.message, "error");
  }
});

function renderTopProducts(items) {
  const tableBody = document.getElementById("topProductsTableBody");

  if (!items.length) {
    tableBody.innerHTML = FreshMart.createEmptyRow("Данных о продажах пока нет.", 4);
    return;
  }

  tableBody.innerHTML = items
    .map(
      (item) => `
        <tr>
          <td>${item.name}</td>
          <td>${item.categoryName}</td>
          <td>${item.unitsSold} шт.</td>
          <td>${FreshMart.formatCurrency(item.revenue)}</td>
        </tr>
      `
    )
    .join("");
}

function renderStock(items) {
  const tableBody = document.getElementById("stockTableBody");

  if (!items.length) {
    tableBody.innerHTML = FreshMart.createEmptyRow("Товары не найдены.", 4);
    return;
  }

  tableBody.innerHTML = items
    .map(
      (item) => `
        <tr>
          <td>${item.name}</td>
          <td>${item.categoryName}</td>
          <td>${FreshMart.formatCurrency(item.price)}</td>
          <td>${item.quantity} шт.</td>
        </tr>
      `
    )
    .join("");
}
