function renderPage(viewName, pageTitle) {
  return (req, res) =>
    res.render(viewName, {
      title: pageTitle,
      currentPath: req.path
    });
}

module.exports = {
  renderLoginPage: renderPage("login", "Вход"),
  renderRegisterPage: renderPage("register", "Регистрация"),
  renderDashboardPage: renderPage("dashboard", "Панель управления"),
  renderProductsPage: renderPage("products", "Товары"),
  renderSalesPage: renderPage("sales", "Продажи"),
  renderReportsPage: renderPage("reports", "Отчёты")
};
