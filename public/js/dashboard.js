document.addEventListener("DOMContentLoaded", async () => {
  try {
    const [summary, topProducts, stock] = await Promise.all([
      FreshMart.request("/api/reports/summary"),
      FreshMart.request("/api/reports/top-products"),
      FreshMart.request("/api/reports/stock")
    ]);

    document.getElementById("totalSalesCount").textContent = summary.totalSalesCount || 0;
    document.getElementById("totalRevenue").textContent = FreshMart.formatCurrency(
      summary.totalRevenue
    );
    document.getElementById("productsCount").textContent = stock.length;
    document.getElementById("lowStockCount").textContent = stock.filter(
      (product) => product.quantity <= 10
    ).length;

    renderTopProducts(topProducts);
    renderStock(stock);
  } catch (error) {
    FreshMart.showAlert(error.message, "error");
  }
});

function renderTopProducts(items) {
  const container = document.getElementById("dashboardTopProducts");

  if (!items.length) {
    container.innerHTML = '<div class="empty-state">Продаж пока нет.</div>';
    return;
  }

  container.innerHTML = items
    .map(
      (item) => `
        <div class="simple-list-item">
          <div>
            <strong>${item.name}</strong>
            <span>${item.categoryName}</span>
          </div>
          <div>
            <strong>${item.unitsSold} шт.</strong>
            <span>${FreshMart.formatCurrency(item.revenue)}</span>
          </div>
        </div>
      `
    )
    .join("");
}

function renderStock(items) {
  const container = document.getElementById("dashboardStock");

  if (!items.length) {
    container.innerHTML = '<div class="empty-state">Товары не добавлены.</div>';
    return;
  }

  container.innerHTML = items
    .slice(0, 5)
    .map(
      (item) => `
        <div class="simple-list-item">
          <div>
            <strong>${item.name}</strong>
            <span>${item.categoryName}</span>
          </div>
          <div>
            <strong>${item.quantity} шт.</strong>
            <span>${FreshMart.formatCurrency(item.price)}</span>
          </div>
        </div>
      `
    )
    .join("");
}
