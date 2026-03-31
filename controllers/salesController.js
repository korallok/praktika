const { getDb, runInTransaction } = require("../db/database");

function normalizeSaleItems(rawItems) {
  if (!Array.isArray(rawItems) || rawItems.length === 0) {
    return { error: "Добавьте хотя бы один товар в продажу." };
  }

  const combinedItems = new Map();

  for (const rawItem of rawItems) {
    const productId = Number(rawItem.productId || rawItem.product_id);
    const quantity = Number(rawItem.quantity);

    if (!Number.isInteger(productId) || productId <= 0) {
      return { error: "В продаже найден некорректный товар." };
    }

    if (!Number.isInteger(quantity) || quantity <= 0) {
      return { error: "Количество в продаже должно быть целым числом больше нуля." };
    }

    combinedItems.set(productId, (combinedItems.get(productId) || 0) + quantity);
  }

  return {
    items: Array.from(combinedItems.entries()).map(([productId, quantity]) => ({
      productId,
      quantity
    }))
  };
}

function getSales(req, res, next) {
  try {
    const db = getDb();
    const sales = db
      .prepare(
        `
        SELECT
          sales.id,
          sales.sale_date AS saleDate,
          sales.total_amount AS totalAmount,
          users.username
        FROM sales
        JOIN users ON users.id = sales.user_id
        ORDER BY sales.sale_date DESC
        `
      )
      .all();

    const saleItems = db
      .prepare(
        `
        SELECT
          sale_items.sale_id AS saleId,
          products.name AS productName,
          sale_items.quantity,
          sale_items.price_at_sale AS priceAtSale
        FROM sale_items
        JOIN products ON products.id = sale_items.product_id
        ORDER BY sale_items.sale_id DESC, products.name
        `
      )
      .all();

    const saleItemsMap = new Map();

    for (const item of saleItems) {
      if (!saleItemsMap.has(item.saleId)) {
        saleItemsMap.set(item.saleId, []);
      }

      saleItemsMap.get(item.saleId).push(item);
    }

    const result = sales.map((sale) => {
      const items = saleItemsMap.get(sale.id) || [];
      const itemSummary = items
        .map((item) => `${item.productName} x${item.quantity}`)
        .join(", ");

      return {
        ...sale,
        items,
        itemSummary
      };
    });

    return res.json(result);
  } catch (error) {
    next(error);
  }
}

function createSale(req, res, next) {
  try {
    const db = getDb();
    const normalized = normalizeSaleItems(req.body.items);

    if (normalized.error) {
      return res.status(400).json({ message: normalized.error });
    }

    const getProduct = db.prepare(
      "SELECT id, name, price, quantity FROM products WHERE id = ?"
    );
    const createSaleRecord = db.prepare(
      "INSERT INTO sales (user_id, sale_date, total_amount) VALUES (?, ?, ?)"
    );
    const createSaleItem = db.prepare(
      "INSERT INTO sale_items (sale_id, product_id, quantity, price_at_sale) VALUES (?, ?, ?, ?)"
    );
    const updateStock = db.prepare(
      "UPDATE products SET quantity = quantity - ? WHERE id = ?"
    );

    const sale = runInTransaction(() => {
      const preparedItems = [];
      let totalAmount = 0;

      for (const item of normalized.items) {
        const product = getProduct.get(item.productId);

        if (!product) {
          const error = new Error("Один из выбранных товаров не найден.");
          error.status = 404;
          throw error;
        }

        if (product.quantity < item.quantity) {
          const error = new Error(
            `Недостаточно товара "${product.name}" на складе. Доступно: ${product.quantity}.`
          );
          error.status = 400;
          throw error;
        }

        const lineTotal = product.price * item.quantity;
        totalAmount += lineTotal;
        preparedItems.push({
          productId: product.id,
          productName: product.name,
          quantity: item.quantity,
          priceAtSale: product.price
        });
      }

      const roundedTotal = Number(totalAmount.toFixed(2));
      const saleDate = new Date().toISOString();
      const saleResult = createSaleRecord.run(req.session.user.id, saleDate, roundedTotal);
      const saleId = saleResult.lastInsertRowid;

      for (const item of preparedItems) {
        createSaleItem.run(saleId, item.productId, item.quantity, item.priceAtSale);
        updateStock.run(item.quantity, item.productId);
      }

      return {
        saleId,
        saleDate,
        totalAmount: roundedTotal,
        items: preparedItems
      };
    });

    return res.status(201).json({
      message: "Продажа успешно сохранена.",
      sale
    });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  getSales,
  createSale
};
