import jwt from "jsonwebtoken";
import { config } from "../config.js";

import Employees from "../models/Employees.js";
import Coordinators from "../models/Coordinators.js";
import Administrators from "../models/Administrators.js";

const verifyToken = async (req, res, next) => {
  try {
    // Obtener token desde cookies o encabezados
    const token = req.cookies?.authToken || req.headers.authorization?.split(" ")[1];

    if (!token) {
      return res.status(401).json({ message: "Token no proporcionado" });
    }

    // Verificar y decodificar el token
    const decoded = jwt.verify(token, config.JWT.secret);
    const { id, userType } = decoded;

    let user = null;

    // Buscar al usuario según el tipo
    if (userType === "Employee") {
      user = await Employees.findById(id).select("-password");
    } else if (userType === "Coordinator") {
      user = await Coordinators.findById(id).select("-password");
    } else if (userType === "Admin") {
      user = await Administrators.findById(id).select("-password");
    }

    if (!user) {
      return res.status(401).json({ message: "Usuario no encontrado" });
    }

    // Agregar datos útiles a req.user
    req.user = {
      ...user._doc,
      userType,
      id: user._id,
      fullName: `${user.names} ${user.surnames}`,
    };

    next();
  } catch (error) {
    console.error("Error en verifyToken:", error.message);
    return res.status(401).json({ message: "Token inválido o expirado" });
  }
};

export default verifyToken;
