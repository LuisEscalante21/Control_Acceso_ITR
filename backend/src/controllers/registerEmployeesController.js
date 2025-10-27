import Employee from "../models/Employees.js";
import bcryptjs from "bcryptjs";
import jsonwebtoken from "jsonwebtoken";
import { config } from "../config.js";
import { v2 as cloudinary } from "cloudinary";
import validator from "validator";
import { emailExistsInAnyCollection } from "../../src/utils/validationUsers.js";
import fs from "fs";

// Configurar cloudinary
cloudinary.config({
  cloud_name: config.cloudinary.cloudinary_name,
  api_key: config.cloudinary.cloudinary_api_key,
  api_secret: config.cloudinary.cloudinary_api_secret,
});

const registerEmployeesController = {};

// I N S E R T
registerEmployeesController.register = async (req, res) => {
  let uploadedImagePath = null;

  try {
    const {
      numEmpleado,
      names,
      surnames,
      DUI,
      birthday,
      telephone,
      email,
      password,
      hireDate,
      IdTeam,
      status,
      address,
    } = req.body;

    // Validación básica - campos requeridos
    if (
      !numEmpleado ||
      !names ||
      !surnames ||
      !DUI ||
      !birthday ||
      !telephone ||
      !email ||
      !password ||
      !hireDate ||
      !IdTeam ||
      !status ||
      !address
    ) {
      return res.status(400).json({
        message: "Todos los campos son requeridos.",
        missingFields: [
          !numEmpleado && "numEmpleado",
          !names && "names",
          !surnames && "surnames",
          !DUI && "DUI",
          !birthday && "birthday",
          !telephone && "telephone",
          !email && "email",
          !password && "password",
          !hireDate && "hireDate",
          !IdTeam && "IdTeam",
          !status && "status",
          !address && "address",
        ].filter(Boolean),
      });
    }

    // Validar formato de email
    const emailTrimmed = email.trim().toLowerCase();
    if (!validator.isEmail(emailTrimmed)) {
      return res.status(400).json({ message: "Formato de email inválido." });
    }

    // Validar que el email termine en @ricaldone.edu.sv
    if (!emailTrimmed.endsWith("@ricaldone.edu.sv")) {
      return res.status(400).json({
        message: "El email debe ser institucional (@ricaldone.edu.sv).",
      });
    }

    // Validar formato de teléfono (1234-5678)
    const phoneRegex = /^\d{4}-\d{4}$/;
    if (!phoneRegex.test(telephone.trim())) {
      return res
        .status(400)
        .json({ message: "Formato de teléfono inválido. Use ####-####." });
    }

    // Validar formato de DUI (12345678-9)
    const duiRegex = /^\d{8}-\d$/;
    if (!duiRegex.test(DUI.trim())) {
      return res
        .status(400)
        .json({ message: "Formato de DUI inválido. Use ########-#." });
    }

    // Validar que la contraseña cumpla requisitos
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).+$/;
    if (password.length < 8) {
      return res
        .status(400)
        .json({ message: "La contraseña debe tener mínimo 8 caracteres." });
    }
    if (!passwordRegex.test(password)) {
      return res.status(400).json({
        message: "La contraseña debe incluir mayúsculas, minúsculas y números.",
      });
    }

    // Validar fecha de nacimiento (no puede ser futura)
    const birthdayDate = new Date(birthday);
    if (birthdayDate > new Date()) {
      return res
        .status(400)
        .json({ message: "La fecha de nacimiento no puede ser futura." });
    }

    // Validar fecha de contratación (debe ser posterior a nacimiento)
    const hireDateObj = new Date(hireDate);
    if (hireDateObj <= birthdayDate) {
      return res.status(400).json({
        message:
          "La fecha de contratación debe ser posterior a la fecha de nacimiento.",
      });
    }

    // Verificar que el email no exista en ninguna colección
    const emailExists = await emailExistsInAnyCollection(emailTrimmed);
    if (emailExists) {
      return res
        .status(400)
        .json({ message: "El email ya existe en el sistema." });
    }

    // Verificar si el empleado ya existe por DUI
    const existByDui = await Employee.findOne({ DUI: DUI.trim() });
    if (existByDui) {
      return res.status(400).json({ message: "El DUI ya está registrado." });
    }

    // Hashear la contraseña
    const passwordHash = await bcryptjs.hash(password, 10);

    // Subir foto a cloudinary si existe
    let photoUrl = "";
    if (req.file) {
      try {
        uploadedImagePath = req.file.path;
        const result = await cloudinary.uploader.upload(req.file.path, {
          folder: "employees",
          allowed_formats: ["jpg", "png", "jpeg"],
          resource_type: "auto",
        });
        photoUrl = result.secure_url;

        // Eliminar archivo local después de subir
        if (fs.existsSync(uploadedImagePath)) {
          fs.unlinkSync(uploadedImagePath);
        }
      } catch (uploadError) {
        console.error("Error al subir imagen a cloudinary:", uploadError);
        // Si falla la subida, continuamos sin foto
        photoUrl = "";
      }
    }

    // Crear nuevo empleado
    const newEmployee = new Employee({
      numEmpleado: numEmpleado.trim(),
      names: names.trim(),
      surnames: surnames.trim(),
      DUI: DUI.trim(),
      birthday: new Date(birthday),
      telephone: telephone.trim(),
      email: emailTrimmed,
      password: passwordHash,
      hireDate: new Date(hireDate),
      IdTeam,
      status: status === "activo" || status === "true" || status === true,
      address: address.trim(),
      photo: photoUrl,
    });

    const savedEmployee = await newEmployee.save();

    // Generar token JWT
    const token = jsonwebtoken.sign(
      { id: savedEmployee._id },
      config.JWT.secret,
      { expiresIn: config.JWT.expiresIn }
    );

    res.cookie("authToken", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
    });

    res.status(201).json({
      message: "Empleado registrado exitosamente.",
      employee: {
        id: savedEmployee._id,
        numEmpleado: savedEmployee.numEmpleado,
        names: savedEmployee.names,
        surnames: savedEmployee.surnames,
        email: savedEmployee.email,
      },
    });
  } catch (error) {
    // Limpiar archivo si falló la operación
    if (uploadedImagePath && fs.existsSync(uploadedImagePath)) {
      try {
        fs.unlinkSync(uploadedImagePath);
      } catch (cleanError) {
        console.error("Error al limpiar archivo temporal:", cleanError);
      }
    }

    console.error("Error al registrar empleado:", error);

    // Manejo específico de errores de validación de Mongoose
    if (error.name === "ValidationError") {
      const messages = Object.values(error.errors).map((err) => err.message);
      return res.status(400).json({
        message: "Error de validación",
        errors: messages,
      });
    }

    // Manejo de errores de duplicidad
    if (error.code === 11000) {
      const field = Object.keys(error.keyPattern)[0];
      return res.status(400).json({
        message: `El campo '${field}' ya existe en el sistema.`,
      });
    }

    res.status(500).json({
      message: "Error al registrar empleado",
      error: error.message,
    });
  }
};

export default registerEmployeesController;
