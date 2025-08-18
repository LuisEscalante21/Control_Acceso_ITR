// src/controllers/loginController.js
import EmployeesModel from "../models/Employees.js";
import CoordinatorsModel from "../models/Coordinators.js";
import AdministratorsModel from "../models/Administrators.js";
import bcryptjs from "bcryptjs";
import jsonwebtoken from "jsonwebtoken";
import CryptoJS from "crypto-js";
import { config } from "../config.js";
import parseExpirationToMs from "../utils/parseExpirationToMs.js";

const loginController = {};

const maxAttempts = 2;
const lockTime = 15 * 60 * 1000;

loginController.login = async (req, res) => {
  const { email, password } = req.body;

  try {
    let userFound;
    let userType;
    let tokenPayload = {};

    // Admin .env
    if (email === config.emailAdmin.email && password === config.emailAdmin.password) {
      userType = "Admin";
      userFound = {
        _id: "Admin",
        fullName: config.emailAdmin.fullName,
        IdTeam: null,
        department: null,
        numEmpleado: null,
        photo: null,
      };
    } else {
      // Buscar usuario por rol
      userFound = await AdministratorsModel.findOne({ email });
      if (userFound) userType = "Admin";
      else {
        userFound = await CoordinatorsModel.findOne({ email });
        if (userFound) userType = "Coordinator";
        else {
          userFound = await EmployeesModel.findOne({ email });
          if (userFound) userType = "Employee";
        }
      }

      if (!userFound) return res.status(401).json({ message: "Usuario no encontrado" });

      if (userFound.status !== undefined && userFound.status !== true) {
        return res.status(403).json({ message: "Usuario inactivo. Contacte al administrador." });
      }

      userFound.loginAttempts = userFound.loginAttempts || 0;
      userFound.lockTime = userFound.lockTime || 0;

      if ((userFound.lockTime || 0) > Date.now()) {
        const remainingMin = Math.ceil((userFound.lockTime - Date.now()) / 60000);
        return res.status(403).json({
          message: "Cuenta bloqueada. Inténtelo de nuevo en: " + remainingMin + " minutos.",
        });
      }

      const isMatch = await bcryptjs.compare(password, userFound.password);
      if (!isMatch) {
        userFound.loginAttempts = (userFound.loginAttempts || 0) + 1;

        if (userFound.loginAttempts > maxAttempts) {
          userFound.lockTime = Date.now() + lockTime;
          await userFound.save();
          return res.status(403).json({ message: "Cuenta esta bloqueada." });
        }

        await userFound.save();
        return res.status(401).json({ message: "Contraseña incorrecta" });
      }
    }

    // Reset bloqueo si aplica
    if (userFound && typeof userFound.save === "function") {
      userFound.loginAttempts = 0;
      userFound.lockTime = 0;
      await userFound.save();
    }

    // ✅ payload siempre con el id del usuario
    tokenPayload = {
      id: userFound._id,   // <-- aquí va el _id
      userType,
    };

    const safePhoto = (photo) => {
      if (!photo) return null;
      if (photo.startsWith("http://") || photo.startsWith("https://")) return photo;
      return null;
    };

    // Enriquecer payload para frontend (nombres, equipo, etc.)
    if (userType === "Admin") {
      tokenPayload.fullName =
        userFound.fullName ||
        (userFound.names && userFound.surnames ? `${userFound.names} ${userFound.surnames}` : "Admin");
      tokenPayload.idTeam = userFound.IdTeam || null;
      tokenPayload.department = userFound.department || null;
      tokenPayload.numEmpleado = userFound.numEmpleado || null;
      tokenPayload.photo = safePhoto(userFound.photo);
    } else if (userType === "Coordinator" || userType === "Employee") {
      tokenPayload.names = userFound.names;
      tokenPayload.surnames = userFound.surnames;
      tokenPayload.fullName = `${userFound.names} ${userFound.surnames}`;
      tokenPayload.idTeam = userFound.IdTeam;
      tokenPayload.department = userFound.department;
      tokenPayload.numEmpleado = userFound.numEmpleado;
      tokenPayload.photo = safePhoto(userFound.photo);
    }

    const cookieMaxAge = parseExpirationToMs(config.JWT.expiresIn);

    jsonwebtoken.sign(
      tokenPayload,
      config.JWT.secret,
      { expiresIn: config.JWT.expiresIn },
      (error, token) => {
        if (error) {
          console.error("Error generando token:", error);
          return res.status(500).json({ message: "Error generando el token" });
        }

        // Cookie httpOnly con el token
        res.cookie("authToken", token, {
          httpOnly: true,
          secure: false,
          sameSite: "lax",
          path: "/",
          maxAge: cookieMaxAge,
        });

        // Info de usuario cifrada para el frontend
        const userInfo = {
          _id: userFound._id,                 // ✅ incluye el id para el FE
          userType,
          fullName: tokenPayload.fullName,
          idTeam: tokenPayload.idTeam,
          numEmpleado: tokenPayload.numEmpleado,
          department: tokenPayload.department,
          photo: tokenPayload.photo,
        };

        const encryptedUserInfo = CryptoJS.AES.encrypt(
          JSON.stringify(userInfo),
          config.JWT.secret
        ).toString();

        res.cookie("userInfo", encryptedUserInfo, {
          httpOnly: false,
          secure: false,
          sameSite: "lax",
          path: "/",
          maxAge: cookieMaxAge,
        });

        // ✅ devuelve también el userId explícito
        return res.json({
          message: "login successful",
          userType,
          token,
          userId: userFound._id,               // <-- aquí te lo llevas al FE si lo necesitas
          fullName: tokenPayload.fullName,
          idTeam: tokenPayload.idTeam,
        });
      }
    );
  } catch (error) {
    console.error("Error en loginController:", error);
    return res.status(500).json({ message: "Error interno del servidor" });
  }
};

export default loginController;
