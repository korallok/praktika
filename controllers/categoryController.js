const { getDb } = require("../db/database");

function getCategories(req, res, next) {
  try {
    const db = getDb();
    const categories = db.prepare("SELECT id, name FROM categories ORDER BY name").all();

    return res.json(categories);
  } catch (error) {
    next(error);
  }
}

module.exports = {
  getCategories
};
