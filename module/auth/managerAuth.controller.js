const managerAuthService = require("./managerAuth.service");

exports.loginManagerWithoutPassword = async (req, res) => {
  try {
    const { identifier } = req.body;
    const result = await managerAuthService.loginManagerWithoutPassword({ identifier });
    res.status(200).json({
      success: true,
      message: "Manager login successful",
      data: result,
    });
  } catch (error) {
    res.status(error.statusCode || 500).json({
      success: false,
      message: error.message || "Manager login failed",
    });
  }
};

exports.getMe = async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: "User not found in token",
      });
    }
    res.status(200).json({
      success: true,
      data: { user: req.user },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to fetch logged-in user",
    });
  }
};
