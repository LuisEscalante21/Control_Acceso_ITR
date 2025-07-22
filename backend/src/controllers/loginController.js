const loginController = {};

import EmployeesModel from "../models/Employees.js";
import CoordinatorsModel from "../models/Coordinators.js"; // Modelo para coordinadores
import AdministratorsModel from "../models/Administrators.js";
import bcryptjs from "bcryptjs";
import jsonwebtoken from "jsonwebtoken";
import { config } from "../config.js";


// I N S E R T
loginController.login = async (req, res) => {
  const { email, password } = req.body;
  try {
    let userFound;
    let userType;

    // 1. Admin (env)
    if (
      email === config.emailAdmin.email &&
      password === config.emailAdmin.password
    ) {
      userType = "Admin";
      userFound = { _id: "Admin" };
    } else {
      // 2. Administrador (modelo)
      userFound = await AdministratorsModel.findOne({ email });
      if (userFound) {
        userType = "Admin";
      } else {
        // 3. Coordinador
        userFound = await CoordinatorsModel.findOne({ email });
        if (userFound) {
          userType = "Coordinator";
        } else {
          // 4. Empleado
          userFound = await EmployeesModel.
          findOne({ email });
          if (userFound) {
            userType = "Employee";
          }
        }
      }

      if (!userFound) {
        return res.status(401).json({ message: "Usuario no encontrado" });
      }

      // Validar si el usuario está activo (para todos los modelos de base de datos)
      if (userFound && userFound.status !== undefined) {
        if (userFound.status !== true) {
          return res.status(403).json({ message: "Usuario inactivo. Contacte al administrador." });
        }
      }

      // Validar contraseña (para usuarios de base de datos)
      const isMatch = await bcryptjs.compare(password, userFound.password);
      if (!isMatch) {
        return res.status(401).json({ message: "Contraseña incorrecta" });
      }
    }

    // Generar token
    jsonwebtoken.sign(
      { id: userFound._id, userType },
      config.JWT.secret,
      { expiresIn: config.JWT.expiresIn },
      (error, token) => {
        if (error) {
          console.log(error);
          return res.status(500).json({ message: "Error generating token" });
        }
        res.cookie("authToken", token, {
          httpOnly: true,
          secure: false,
          sameSite: "lax",
        });
        res.json({ message: "login successful", userType });
      }
    );
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Internal server error aqui" });
  }
};


export default loginController;