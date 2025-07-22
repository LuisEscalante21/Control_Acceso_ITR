import jsonwebtoken from "jsonwebtoken";
import { config } from "../config.js";

const authController = {};

authController.checkAuth = (req, res) => {
  const token = req.cookies.authToken;

  if (!token) {
    return res.status(401).json({ message: "Unauthorized: No token provided" });
  }

  try {
    const decoded = jsonwebtoken.verify(token, config.JWT.secret);
    // Puedes devolver info útil sobre el usuario
    res.json({ message: "Authenticated", user: decoded });
  } catch (error) {
    res.status(401).json({ message: "Invalid or expired token" });
  }
};

export default authController;
