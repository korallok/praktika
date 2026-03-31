function attachCurrentUser(req, res, next) {
  res.locals.currentUser = req.session.user || null;
  next();
}

function requireAuth(req, res, next) {
  if (!req.session.user) {
    return res.redirect("/login");
  }

  next();
}

function requireAuthForApi(req, res, next) {
  if (!req.session.user) {
    return res.status(401).json({ message: "Требуется авторизация." });
  }

  next();
}

function redirectIfAuthenticated(req, res, next) {
  if (req.session.user) {
    return res.redirect("/dashboard");
  }

  next();
}

module.exports = {
  attachCurrentUser,
  requireAuth,
  requireAuthForApi,
  redirectIfAuthenticated
};
