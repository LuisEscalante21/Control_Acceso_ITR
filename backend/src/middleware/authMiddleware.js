import jwt from "jsonwebtoken"; 
import { config } from "../config.js";
import Employee from "../models/Employees.js";
import Coordinator from "../models/Coordinators.js";
import Administrator from "../models/Administrators.js";

export const authMiddleware = async (req, res, next) => {
  try {
    const token = req.cookies.authToken || req.headers.authorization?.split(' ')[1];
    if (!token) return res.status(401).json({ message: "No autenticado" });

    const decoded = jwt.verify(token, config.JWT.secret);

    // Caso especial para Admin del .env
    if (decoded.isReadOnly && decoded.id === "Admin") {
      req.user = {
        _id: "Admin",
        userType: "administrator",
        name: "Admin ReadOnly",
        isReadOnly: true,
      };
      return next();
    }

    let user = null;

    switch (decoded.userType.toLowerCase()) {
      case "employee":
        user = await Employee.findById(decoded.id);
        break;
      case "coordinator":
        user = await Coordinator.findById(decoded.id);
        break;
      case "admin":
      case "administrator":
        user = await Administrator.findById(decoded.id);
        break;
      default:
        return res.status(401).json({ message: "Tipo de usuario no válido" });
    }

    if (!user) return res.status(404).json({ message: "Usuario no encontrado" });

    req.user = user;
    next();
  } catch (error) {
    console.error("Error en authMiddleware:", error);
    res.status(401).json({ message: "Token inválido o expirado" });
  }
};
