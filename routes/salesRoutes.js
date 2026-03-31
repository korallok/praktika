const express = require("express");
const salesController = require("../controllers/salesController");

const router = express.Router();

router.get("/", salesController.getSales);
router.post("/", salesController.createSale);

module.exports = router;
