const express = require("express");
const pageController = require("../controllers/pageController");
const { requireAuth, redirectIfAuthenticated } = require("../middleware/auth");

const router = express.Router();

router.get("/", (req, res) => {
  if (req.session.user) {
    return res.redirect("/dashboard");
  }

  return res.redirect("/login");
});

router.get("/login", redirectIfAuthenticated, pageController.renderLoginPage);
router.get("/register", redirectIfAuthenticated, pageController.renderRegisterPage);
router.get("/dashboard", requireAuth, pageController.renderDashboardPage);
router.get("/products", requireAuth, pageController.renderProductsPage);
router.get("/sales", requireAuth, pageController.renderSalesPage);
router.get("/reports", requireAuth, pageController.renderReportsPage);

module.exports = router;
