import jwt from "jsonwebtoken";
import { config } from "../config.js";
import Employee from "../models/Employees.js";
import Coordinator from "../models/Coordinators.js";
import Administrator from "../models/Administrators.js";

export const authMiddleware = async (req, res, next) => {
  try {
    // 🔑 Aceptar ambos tokens (login y recuperación)
    const token =
      req.cookies.authToken ||
      req.cookies.tokenRecoveryCode || // 👈 también aceptar este
      req.headers.authorization?.split(" ")[1];

    if (!token) return res.status(401).json({ message: "No autenticado" });

    let decoded;
    try {
      decoded = jwt.verify(token, config.JWT.secret);
    } catch (err) {
      console.error("❌ Error al verificar token:", err.message);
      return res.status(401).json({ message: "Token inválido o expirado" });
    }

    // ⚙️ Si es token de recuperación (verificado)
    if (decoded.code && decoded.verified) {
      req.user = {
        _id: decoded.id,
        id: decoded.id,
        userType: decoded.userType,
        isRecoveryFlow: true, // opcional, para saber de dónde viene
      };
      return next();
    }

    // ⚙️ Si es token normal de sesión (authToken)
    // Caso especial: Admin del .env
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

    switch (decoded.userType?.toLowerCase()) {
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
    console.error("⚠️ Error en authMiddleware:", error);
    res.status(401).json({ message: "Token inválido o expirado" });
  }
};
