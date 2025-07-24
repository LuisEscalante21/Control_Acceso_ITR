import EmployeesModel from "../models/Employees.js";
import CoordinatorsModel from "../models/Coordinators.js";
import AdministratorsModel from "../models/Administrators.js";
import bcryptjs from "bcryptjs";
import jsonwebtoken from "jsonwebtoken";
import { config } from "../config.js";
import parseExpirationToMs from "../utils/parseExpirationToMs.js";

const loginController = {};

loginController.login = async (req, res) => {
  const { email, password } = req.body;

  try {
    let userFound;
    let userType;
    let tokenPayload = {};

    // 1. Admin desde .env
    if (email === config.emailAdmin.email && password === config.emailAdmin.password) {
      userType = "Admin";
      userFound = { _id: "Admin" };
    } else {
      // 2. Buscar en Administradores
      userFound = await AdministratorsModel.findOne({ email });
      if (userFound) {
        userType = "Admin";
      } else {
        // 3. Buscar en Coordinadores
        userFound = await CoordinatorsModel.findOne({ email });
        if (userFound) {
          userType = "Coordinator";
        } else {
          // 4. Buscar en Empleados
          userFound = await EmployeesModel.findOne({ email });
          if (userFound) {
            userType = "Employee";
          }
        }
      }

      if (!userFound) {
        return res.status(401).json({ message: "Usuario no encontrado" });
      }

      if (userFound.status !== undefined && userFound.status !== true) {
        return res.status(403).json({ message: "Usuario inactivo. Contacte al administrador." });
      }

      const isMatch = await bcryptjs.compare(password, userFound.password);
      if (!isMatch) {
        return res.status(401).json({ message: "Contraseña incorrecta" });
      }
    }

    // Payload del token
    tokenPayload = {
      id: userFound._id,
      userType,
    };

    // Agregar datos extendidos
    if (userType === "Coordinator" || userType === "Employee") {
      tokenPayload.names = userFound.names;
      tokenPayload.surnames = userFound.surnames;
      tokenPayload.fullName = `${userFound.names} ${userFound.surnames}`;
      tokenPayload.idTeam = userFound.IdTeam;
      tokenPayload.department = userFound.department;
      tokenPayload.numEmpleado = userFound.numEmpleado;
      tokenPayload.photo = userFound.photo;
    }

    const cookieMaxAge = parseExpirationToMs(config.JWT.expiresIn) || 1000 * 60 * 60 * 24 * 30;

    // Firmar el token JWT
    jsonwebtoken.sign(
      tokenPayload,
      config.JWT.secret,
      { expiresIn: config.JWT.expiresIn },
      (error, token) => {
        if (error) {
          console.error(error);
          return res.status(500).json({ message: "Error generando el token" });
        }

        // Cookie de autenticación
        res.cookie("authToken", token, {
          httpOnly: true,
          secure: false, // true en producción con HTTPS
          sameSite: "lax",
          path: "/",
          maxAge: cookieMaxAge,
        });

        // Cookie visible con info del usuario
        if (userType === "Coordinator" || userType === "Employee") {
          res.cookie("userInfo", JSON.stringify({
            userType,
            fullName: tokenPayload.fullName,
            idTeam: tokenPayload.idTeam,
            numEmpleado: tokenPayload.numEmpleado,
            department: tokenPayload.department,
            photo: tokenPayload.photo,
          }), {
            httpOnly: false,
            secure: false,
            sameSite: "lax",
            path: "/",
            maxAge: cookieMaxAge,
          });
        }

        // Respuesta al frontend
        res.json({
          message: "login successful",
          userType,
          token,
          fullName: tokenPayload.fullName || null,
          idTeam: tokenPayload.idTeam || null,
        });
      }
    );
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error interno del servidor" });
  }
};

export default loginController;