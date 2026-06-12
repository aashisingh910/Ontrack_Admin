const requireRole = (...roles) => {
  return (req, res, next) => {
    const userRole = String(req.user?.role || "").toUpperCase();
    const allowedRoles = roles.map((r) => String(r).toUpperCase());

    if (!userRole || !allowedRoles.includes(userRole)) {
      return res.status(403).json({
        success: false,
        message: "Forbidden. You do not have access.",
      });
    }
    next();
  };
};

module.exports = requireRole;
