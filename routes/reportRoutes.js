const express = require("express");
const reportController = require("../controllers/reportController");

const router = express.Router();

router.get("/summary", reportController.getSummaryReport);
router.get("/top-products", reportController.getTopProducts);
router.get("/stock", reportController.getStockReport);

module.exports = router;
