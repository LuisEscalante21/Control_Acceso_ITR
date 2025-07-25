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

    // 1. Validar admin hardcoded en .env
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
      // 2. Buscar admin en BD
      userFound = await AdministratorsModel.findOne({ email });
      if (userFound) {
        userType = "Admin";
      } else {
        // 3. Buscar coordinator en BD
        userFound = await CoordinatorsModel.findOne({ email });
        if (userFound) {
          userType = "Coordinator";
        } else {
          // 4. Buscar empleado en BD
          userFound = await EmployeesModel.findOne({ email });
          if (userFound) {
            userType = "Employee";
          }
        }
      }

      // Si no encontró usuario en ninguna colección
      if (!userFound) {
        return res.status(401).json({ message: "Usuario no encontrado" });
      }

      // Verificar si está activo (si el campo existe)
      if (userFound.status !== undefined && userFound.status !== true) {
        return res.status(403).json({ message: "Usuario inactivo. Contacte al administrador." });
      }

      // Comparar contraseña (no en admin hardcoded)
      const isMatch = await bcryptjs.compare(password, userFound.password);
      if (!isMatch) {
        return res.status(401).json({ message: "Contraseña incorrecta" });
      }
    }

    // Construir payload común para JWT
    tokenPayload = {
      id: userFound._id,
      userType,
    };

    // Función para obtener foto segura (sin base64)
    const safePhoto = (photo) => {
      if (!photo) return null;
      // Si es URL (por ejemplo empieza con http o https), úsala
      if (photo.startsWith("http://") || photo.startsWith("https://")) return photo;
      // Si es base64 u otro, no incluir para evitar problema tamaño cookie
      return null;
    };

    // Agregar datos extendidos al payload según tipo de usuario
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

    // Calcular duración cookie/token
    const cookieMaxAge = parseExpirationToMs(config.JWT.expiresIn);

    // Firmar token JWT
    jsonwebtoken.sign(
      tokenPayload,
      config.JWT.secret,
      { expiresIn: config.JWT.expiresIn },
      (error, token) => {
        if (error) {
          console.error("Error generando token:", error);
          return res.status(500).json({ message: "Error generando el token" });
        }

        // Enviar cookie httpOnly con token (para backend)
        res.cookie("authToken", token, {
          httpOnly: true,
          secure: false, // En producción: true si usas HTTPS
          sameSite: "lax",
          path: "/",
          maxAge: cookieMaxAge,
        });

        // Enviar cookie accesible desde frontend con info del usuario, sin foto pesada
        res.cookie(
          "userInfo",
          JSON.stringify({
            userType,
            fullName: tokenPayload.fullName,
            idTeam: tokenPayload.idTeam,
            numEmpleado: tokenPayload.numEmpleado,
            department: tokenPayload.department,
            photo: tokenPayload.photo,
          }),
          {
            httpOnly: false,
            secure: false,
            sameSite: "lax",
            path: "/",
            maxAge: cookieMaxAge,
          }
        );

        // Responder con json
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
