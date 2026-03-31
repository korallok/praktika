const { getDb } = require("../db/database");

function parseProductPayload(body) {
  return {
    name: String(body.name || "").trim(),
    price: Number(body.price),
    quantity: Number(body.quantity),
    categoryId: Number(body.categoryId || body.category_id)
  };
}

function validateProduct(product) {
  if (!product.name || product.name.length < 2) {
    return "Название товара должно содержать не менее 2 символов.";
  }

  if (!Number.isFinite(product.price) || product.price < 0) {
    return "Цена товара должна быть положительным числом.";
  }

  if (!Number.isInteger(product.quantity) || product.quantity < 0) {
    return "Количество товара должно быть целым числом от 0 и выше.";
  }

  if (!Number.isInteger(product.categoryId) || product.categoryId <= 0) {
    return "Необходимо выбрать категорию.";
  }

  return null;
}

function getProducts(req, res, next) {
  try {
    const db = getDb();
    const search = String(req.query.search || "").trim();
    const searchValue = `%${search}%`;

    const products = db
      .prepare(
        `
        SELECT
          products.id,
          products.name,
          products.price,
          products.quantity,
          products.category_id AS categoryId,
          categories.name AS categoryName
        FROM products
        JOIN categories ON categories.id = products.category_id
        WHERE products.name LIKE ?
        ORDER BY products.name
        `
      )
      .all(searchValue);

    return res.json(products);
  } catch (error) {
    next(error);
  }
}

function createProduct(req, res, next) {
  try {
    const db = getDb();
    const product = parseProductPayload(req.body);
    const validationError = validateProduct(product);

    if (validationError) {
      return res.status(400).json({ message: validationError });
    }

    const category = db
      .prepare("SELECT id FROM categories WHERE id = ?")
      .get(product.categoryId);

    if (!category) {
      return res.status(400).json({ message: "Выбранная категория не найдена." });
    }

    const result = db
      .prepare("INSERT INTO products (name, price, quantity, category_id) VALUES (?, ?, ?, ?)")
      .run(product.name, product.price, product.quantity, product.categoryId);

    const createdProduct = db
      .prepare(
        `
        SELECT
          products.id,
          products.name,
          products.price,
          products.quantity,
          products.category_id AS categoryId,
          categories.name AS categoryName
        FROM products
        JOIN categories ON categories.id = products.category_id
        WHERE products.id = ?
        `
      )
      .get(result.lastInsertRowid);

    return res.status(201).json({
      message: "Товар успешно добавлен.",
      product: createdProduct
    });
  } catch (error) {
    if (error.code === "SQLITE_CONSTRAINT_UNIQUE") {
      return res.status(409).json({ message: "Товар с таким названием уже существует." });
    }

    next(error);
  }
}

function updateProduct(req, res, next) {
  try {
    const db = getDb();
    const productId = Number(req.params.id);
    const product = parseProductPayload(req.body);
    const validationError = validateProduct(product);

    if (!Number.isInteger(productId) || productId <= 0) {
      return res.status(400).json({ message: "Некорректный идентификатор товара." });
    }

    if (validationError) {
      return res.status(400).json({ message: validationError });
    }

    const existingProduct = db.prepare("SELECT id FROM products WHERE id = ?").get(productId);
    if (!existingProduct) {
      return res.status(404).json({ message: "Товар не найден." });
    }

    const category = db
      .prepare("SELECT id FROM categories WHERE id = ?")
      .get(product.categoryId);

    if (!category) {
      return res.status(400).json({ message: "Выбранная категория не найдена." });
    }

    db.prepare(
      `
      UPDATE products
      SET name = ?, price = ?, quantity = ?, category_id = ?
      WHERE id = ?
      `
    ).run(product.name, product.price, product.quantity, product.categoryId, productId);

    const updatedProduct = db
      .prepare(
        `
        SELECT
          products.id,
          products.name,
          products.price,
          products.quantity,
          products.category_id AS categoryId,
          categories.name AS categoryName
        FROM products
        JOIN categories ON categories.id = products.category_id
        WHERE products.id = ?
        `
      )
      .get(productId);

    return res.json({
      message: "Товар успешно обновлён.",
      product: updatedProduct
    });
  } catch (error) {
    if (error.code === "SQLITE_CONSTRAINT_UNIQUE") {
      return res.status(409).json({ message: "Товар с таким названием уже существует." });
    }

    next(error);
  }
}

function deleteProduct(req, res, next) {
  try {
    const db = getDb();
    const productId = Number(req.params.id);

    if (!Number.isInteger(productId) || productId <= 0) {
      return res.status(400).json({ message: "Некорректный идентификатор товара." });
    }

    const existingProduct = db.prepare("SELECT id FROM products WHERE id = ?").get(productId);
    if (!existingProduct) {
      return res.status(404).json({ message: "Товар не найден." });
    }

    db.prepare("DELETE FROM products WHERE id = ?").run(productId);

    return res.json({ message: "Товар успешно удалён." });
  } catch (error) {
    if (error.code === "SQLITE_CONSTRAINT_FOREIGNKEY") {
      return res.status(409).json({
        message: "Товар уже участвует в продажах и не может быть удалён."
      });
    }

    next(error);
  }
}

module.exports = {
  getProducts,
  createProduct,
  updateProduct,
  deleteProduct
};
