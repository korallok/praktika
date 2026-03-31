const bcrypt = require("bcrypt");
const { getDb } = require("../db/database");

function validateCredentials(username, password) {
  if (!username || typeof username !== "string" || username.trim().length < 3) {
    return "Логин должен содержать не менее 3 символов.";
  }

  if (!password || typeof password !== "string" || password.length < 6) {
    return "Пароль должен содержать не менее 6 символов.";
  }

  return null;
}

async function register(req, res, next) {
  try {
    const username = String(req.body.username || "").trim();
    const password = String(req.body.password || "");
    const passwordConfirm = String(req.body.passwordConfirm || "");

    const validationError = validateCredentials(username, password);
    if (validationError) {
      return res.status(400).json({ message: validationError });
    }

    if (passwordConfirm && password !== passwordConfirm) {
      return res.status(400).json({ message: "Пароли не совпадают." });
    }

    const db = getDb();
    const existingUser = db.prepare("SELECT id FROM users WHERE username = ?").get(username);

    if (existingUser) {
      return res.status(409).json({ message: "Пользователь с таким логином уже существует." });
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const result = db
      .prepare("INSERT INTO users (username, password_hash, created_at) VALUES (?, ?, ?)")
      .run(username, passwordHash, new Date().toISOString());

    req.session.user = {
      id: result.lastInsertRowid,
      username
    };

    return res.status(201).json({
      message: "Регистрация выполнена успешно.",
      user: req.session.user
    });
  } catch (error) {
    next(error);
  }
}

async function login(req, res, next) {
  try {
    const username = String(req.body.username || "").trim();
    const password = String(req.body.password || "");

    const validationError = validateCredentials(username, password);
    if (validationError) {
      return res.status(400).json({ message: validationError });
    }

    const db = getDb();
    const user = db
      .prepare("SELECT id, username, password_hash FROM users WHERE username = ?")
      .get(username);

    if (!user) {
      return res.status(401).json({ message: "Неверный логин или пароль." });
    }

    const isPasswordValid = await bcrypt.compare(password, user.password_hash);
    if (!isPasswordValid) {
      return res.status(401).json({ message: "Неверный логин или пароль." });
    }

    req.session.user = {
      id: user.id,
      username: user.username
    };

    return res.json({
      message: "Вход выполнен успешно.",
      user: req.session.user
    });
  } catch (error) {
    next(error);
  }
}

function logout(req, res, next) {
  req.session.destroy((error) => {
    if (error) {
      return next(error);
    }

    res.clearCookie("connect.sid");
    return res.json({ message: "Вы вышли из системы." });
  });
}

module.exports = {
  register,
  login,
  logout
};
