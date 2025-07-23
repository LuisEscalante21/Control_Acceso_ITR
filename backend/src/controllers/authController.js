import jsonwebtoken from "jsonwebtoken";
import { config } from "../config.js";

const authController = {};

// Verifica si el token de autenticación es válido
authController.checkAuth = (req, res) => {
  const token = req.cookies?.authToken;

  if (!token) {
    return res.status(401).json({ message: "Unauthorized: No token provided" });
  }

  try {
    const decoded = jsonwebtoken.verify(token, config.JWT.secret);

    // Opcional: podrías agregar lógica aquí para validar si el usuario sigue activo en la base de datos

    return res.status(200).json({
      message: "Authenticated",
      user: decoded,
    });
  } catch (error) {
    console.error("Token inválido:", error.message);
    return res.status(401).json({ message: "Invalid token" });
  }
};

export default authController;