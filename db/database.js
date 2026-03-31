const fs = require("fs");
const path = require("path");
const bcrypt = require("bcrypt");
const { DatabaseSync } = require("node:sqlite");

const DB_PATH = path.join(__dirname, "freshmart.sqlite");
const SCHEMA_PATH = path.join(__dirname, "schema.sql");

const seedCategories = [
  "Овощи и фрукты",
  "Молочные продукты",
  "Напитки",
  "Бакалея"
];

const seedProducts = [
  { name: "Яблоки", price: 129.9, quantity: 35, categoryName: "Овощи и фрукты" },
  { name: "Бананы", price: 139.5, quantity: 28, categoryName: "Овощи и фрукты" },
  { name: "Молоко 3.2%", price: 89.9, quantity: 18, categoryName: "Молочные продукты" },
  { name: "Творог", price: 159, quantity: 12, categoryName: "Молочные продукты" },
  { name: "Минеральная вода", price: 59, quantity: 40, categoryName: "Напитки" },
  { name: "Рис", price: 124, quantity: 22, categoryName: "Бакалея" }
];

const seedUser = {
  username: "admin",
  password: "admin123"
};

let dbInstance;

function applySchema(db) {
  const schema = fs.readFileSync(SCHEMA_PATH, "utf8");
  db.exec(schema);
}

function seedDatabase(db) {
  const categoriesCount = db.prepare("SELECT COUNT(*) AS count FROM categories").get().count;
  const productsCount = db.prepare("SELECT COUNT(*) AS count FROM products").get().count;
  const usersCount = db.prepare("SELECT COUNT(*) AS count FROM users").get().count;

  const insertCategory = db.prepare("INSERT OR IGNORE INTO categories (name) VALUES (?)");
  const insertProduct = db.prepare(
    "INSERT OR IGNORE INTO products (name, price, quantity, category_id) VALUES (?, ?, ?, ?)"
  );
  const insertUser = db.prepare(
    "INSERT INTO users (username, password_hash, created_at) VALUES (?, ?, ?)"
  );

  if (categoriesCount === 0) {
    for (const categoryName of seedCategories) {
      insertCategory.run(categoryName);
    }
  }

  const categoryRows = db.prepare("SELECT id, name FROM categories").all();
  const categoryMap = new Map(categoryRows.map((category) => [category.name, category.id]));

  if (productsCount === 0) {
    for (const product of seedProducts) {
      insertProduct.run(
        product.name,
        product.price,
        product.quantity,
        categoryMap.get(product.categoryName)
      );
    }
  }

  if (usersCount === 0) {
    const passwordHash = bcrypt.hashSync(seedUser.password, 10);
    insertUser.run(seedUser.username, passwordHash, new Date().toISOString());
  }
}

function initializeDatabase() {
  if (dbInstance) {
    return dbInstance;
  }

  dbInstance = new DatabaseSync(DB_PATH);
  dbInstance.exec("PRAGMA foreign_keys = ON");
  applySchema(dbInstance);
  seedDatabase(dbInstance);

  return dbInstance;
}

function getDb() {
  return dbInstance || initializeDatabase();
}

function runInTransaction(callback) {
  const db = getDb();
  db.exec("BEGIN IMMEDIATE");

  try {
    const result = callback(db);
    db.exec("COMMIT");
    return result;
  } catch (error) {
    db.exec("ROLLBACK");
    throw error;
  }
}

module.exports = {
  DB_PATH,
  initializeDatabase,
  getDb,
  runInTransaction,
  seedDatabase,
  seedUser
};
