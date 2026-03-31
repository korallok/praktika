const { getDb } = require("../db/database");

function getSummaryReport(req, res, next) {
  try {
    const db = getDb();
    const summary = db
      .prepare(
        `
        SELECT
          COUNT(*) AS totalSalesCount,
          COALESCE(SUM(total_amount), 0) AS totalRevenue
        FROM sales
        `
      )
      .get();

    return res.json(summary);
  } catch (error) {
    next(error);
  }
}

function getTopProducts(req, res, next) {
  try {
    const db = getDb();
    const topProducts = db
      .prepare(
        `
        SELECT
          products.id,
          products.name,
          categories.name AS categoryName,
          COALESCE(SUM(sale_items.quantity), 0) AS unitsSold,
          COALESCE(SUM(sale_items.quantity * sale_items.price_at_sale), 0) AS revenue
        FROM products
        JOIN categories ON categories.id = products.category_id
        LEFT JOIN sale_items ON sale_items.product_id = products.id
        GROUP BY products.id, products.name, categories.name
        ORDER BY unitsSold DESC, products.name ASC
        LIMIT 5
        `
      )
      .all();

    return res.json(topProducts);
  } catch (error) {
    next(error);
  }
}

function getStockReport(req, res, next) {
  try {
    const db = getDb();
    const stock = db
      .prepare(
        `
        SELECT
          products.id,
          products.name,
          products.price,
          products.quantity,
          categories.name AS categoryName
        FROM products
        JOIN categories ON categories.id = products.category_id
        ORDER BY products.quantity ASC, products.name ASC
        `
      )
      .all();

    return res.json(stock);
  } catch (error) {
    next(error);
  }
}

module.exports = {
  getSummaryReport,
  getTopProducts,
  getStockReport
};
