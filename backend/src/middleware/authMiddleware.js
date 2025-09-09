import jwt from "jsonwebtoken";
import { config } from "../config.js";
import Employee from "../models/Employees.js";

export const authMiddleware = async (req, res, next) => {
  try {
    const token = req.cookies.authToken;

    if (!token) {
      return res.status(401).json({ message: "No autenticado" });
    }

    // Verificar JWT
    const decoded = jwt.verify(token, config.JWT.secret);

    // Buscar al empleado en la base de datos
    const employee = await Employee.findById(decoded.id);

    if (!employee) {
      return res.status(404).json({ message: "Empleado no encontrado" });
    }

    // Guardar el empleado en req.user
    req.user = employee;

    next();
  } catch (error) {
    console.error("Error en authMiddleware:", error);
    res.status(401).json({ message: "Token inválido o expirado" });
  }
};