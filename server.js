require("dotenv").config();

const express = require("express");
const path = require("path");
const session = require("express-session");

const { initializeDatabase } = require("./db/database");
const { attachCurrentUser, requireAuthForApi } = require("./middleware/auth");
const pageRoutes = require("./routes/pageRoutes");
const authRoutes = require("./routes/authRoutes");
const categoryRoutes = require("./routes/categoryRoutes");
const productRoutes = require("./routes/productRoutes");
const salesRoutes = require("./routes/salesRoutes");
const reportRoutes = require("./routes/reportRoutes");

initializeDatabase();

const app = express();
const PORT = process.env.PORT || 3000;

app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));

app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(
  session({
    secret: process.env.SESSION_SECRET || "freshmart-demo-secret",
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      maxAge: 1000 * 60 * 60 * 8
    }
  })
);
app.use(express.static(path.join(__dirname, "public")));
app.use(attachCurrentUser);

app.use("/", pageRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/categories", requireAuthForApi, categoryRoutes);
app.use("/api/products", requireAuthForApi, productRoutes);
app.use("/api/sales", requireAuthForApi, salesRoutes);
app.use("/api/reports", requireAuthForApi, reportRoutes);

app.use((req, res) => {
  if (req.path.startsWith("/api")) {
    return res.status(404).json({ message: "Маршрут не найден." });
  }

  return res.status(404).render("404", {
    title: "Страница не найдена",
    currentPath: req.path
  });
});

app.use((error, req, res, next) => {
  console.error(error);

  if (req.path.startsWith("/api")) {
    return res.status(error.status || 500).json({
      message: error.message || "Произошла ошибка на сервере."
    });
  }

  return res.status(error.status || 500).render("error", {
    title: "Ошибка",
    currentPath: req.path,
    message: error.message || "Произошла ошибка на сервере."
  });
});

app.listen(PORT, () => {
  console.log(`FreshMart доступен по адресу http://localhost:${PORT}`);
});
