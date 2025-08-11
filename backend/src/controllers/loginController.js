import EmployeesModel from "../models/Employees.js";
import CoordinatorsModel from "../models/Coordinators.js";
import AdministratorsModel from "../models/Administrators.js";
import bcryptjs from "bcryptjs";
import jsonwebtoken from "jsonwebtoken";
import CryptoJS from "crypto-js";       
import { config } from "../config.js";
import parseExpirationToMs from "../utils/parseExpirationToMs.js";

const loginController = {};

// Declarar 2 constantes
//Una que guarde el numero de intentos fallidos de inicio de sesión
//Otra que guarde el tiempo del último intento fallido de inicio de sesión
const maxAttempts = 2; // Número máximo de intentos fallidos
const lockTime = 15 * 60 * 1000; // Tiempo de bloqueo en milisegundos (15 minutos)

loginController.login = async (req, res) => {
  const { email, password } = req.body;

  try {
    let userFound;
    let userType;
    let tokenPayload = {};

    // Validar admin hardcoded en .env
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
      // Buscar admin, coordinator, empleado en BD...
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

      // Normalizar campos por si vienen undefined
      userFound.loginAttempts = userFound.loginAttempts || 0;
      userFound.lockTime = userFound.lockTime || 0;

      // Bloqueo de acceso por intentos fallidos
      if ((userFound.lockTime || 0) > Date.now()) {
        const remainingMin = Math.ceil((userFound.lockTime - Date.now()) / 60000);
        return res.status(403).json({
          message: "Cuenta bloqueada. Inténtelo de nuevo en: " + remainingMin + " minutos.",
        });
      }

      const isMatch = await bcryptjs.compare(password, userFound.password);

      // ❗ Si NO coincide la contraseña, incrementar intentos y manejar bloqueo
      if (!isMatch) {
        userFound.loginAttempts = (userFound.loginAttempts || 0) + 1;

        if (userFound.loginAttempts > maxAttempts) {
          userFound.lockTime = Date.now() + lockTime; // Bloquear cuenta
          await userFound.save();
          return res.status(403).json({ message: "Cuenta esta bloqueada." });
        }

        await userFound.save(); // Guardar cambios en la BD
        return res.status(401).json({ message: "Contraseña incorrecta" });
      }
      // Si la contraseña es correcta, no hagas nada aquí: seguimos abajo al éxito
    }

    // Si llegamos aquí, el usuario fue encontrado y la contraseña es correcta
    // Resetear contadores SOLO si es un documento de Mongoose (tiene .save)
    if (userFound && typeof userFound.save === "function") {
      userFound.loginAttempts = 0; // Reiniciar contador de intentos fallidos
      userFound.lockTime = 0; // Reiniciar tiempo de bloqueo del usuario
      await userFound.save(); // Guardar cambios en la BD
    }

    // Payload JWT para backend
    tokenPayload = {
      id: userFound._id,
      userType,
    };

    const safePhoto = (photo) => {
      if (!photo) return null;
      if (photo.startsWith("http://") || photo.startsWith("https://")) return photo;
      return null;
    };

    // Agregar info extra
    if (userType === "Admin") {
      tokenPayload.fullName = userFound.fullName || (userFound.names && userFound.surnames
        ? `${userFound.names} ${userFound.surnames}`
        : "Admin");
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

    // Firmar JWT backend
    jsonwebtoken.sign(
      tokenPayload,
      config.JWT.secret,
      { expiresIn: config.JWT.expiresIn },
      (error, token) => {
        if (error) {
          console.error("Error generando token:", error);
          return res.status(500).json({ message: "Error generando el token" });
        }

        // Cookie httpOnly backend
        res.cookie("authToken", token, {
          httpOnly: true,
          secure: false,
          sameSite: "lax",
          path: "/",
          maxAge: cookieMaxAge,
        });

        // Crear objeto userInfo plano
        const userInfo = {
          _id: userFound._id,
          userType,
          fullName: tokenPayload.fullName,
          idTeam: tokenPayload.idTeam,
          numEmpleado: tokenPayload.numEmpleado,
          department: tokenPayload.department,
          photo: tokenPayload.photo,
        };

        // Cifrar userInfo con AES usando crypto-js y clave secreta
        const encryptedUserInfo = CryptoJS.AES.encrypt(
          JSON.stringify(userInfo),
          config.JWT.secret
        ).toString();

        // Enviar cookie no httpOnly accesible en frontend con userInfo cifrada
        res.cookie("userInfo", encryptedUserInfo, {
          httpOnly: false,
          secure: false,
          sameSite: "lax",
          path: "/",
          maxAge: cookieMaxAge,
        });

        return res.json({
          message: "login successful",
          userType,
          token,
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
