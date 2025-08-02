import Administrator from "../models/Administrators.js";
import bcryptjs from "bcryptjs";
import jsonwebtoken from "jsonwebtoken";
import { config } from "../config.js";
import { v2 as cloudinary } from "cloudinary";
import validator from "validator"; 
import { emailExistsInAnyCollection } from "../../src/utils/validationUsers.js";
// Configurar cloudinary
cloudinary.config({
  cloud_name: config.cloudinary.cloudinary_name,
  api_key: config.cloudinary.cloudinary_api_key,
  api_secret: config.cloudinary.cloudinary_api_secret,
});

const registerAdministratorsController = {};

// I N S E R T
registerAdministratorsController.register = async (req, res) => {
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
      status,
      address,
    } = req.body;

    // Validar campos requeridos
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
      !status ||
      !address
    ) {
      return res.status(400).json({ message: "All fields are required." });
    }

    // Validar formato de email
    if (!validator.isEmail(email)) {
      return res.status(400).json({ message: "Invalid email format." });
    }

    // Validar formato de teléfono (1234-5678)
    const phoneRegex = /^\d{4}-\d{4}$/;
    if (!phoneRegex.test(telephone)) {
      return res.status(400).json({ message: "Invalid telephone format." });
    }

    // Validar formato de DUI (12345678-9)
    const duiRegex = /^\d{8}-\d$/;
    if (!duiRegex.test(DUI)) {
      return res.status(400).json({ message: "Invalid DUI format." });
    }

    // Verificar email global
    const emailExists = await emailExistsInAnyCollection(email);
    if (emailExists) {
      return res.status(400).json({ message: "Email already exists in the system." });
    }

    const passwordHash = await bcryptjs.hash(password, 10);

    // Subir foto a Cloudinary si existe
    let photoUrl = "";
    if (req.file) {
      const result = await cloudinary.uploader.upload(req.file.path, {
        folder: "administrators",
        allowed_formats: ["jpg", "png", "jpeg"],
      });
      photoUrl = result.secure_url;
    }

    const newAdministrator = new Administrator({
      numEmpleado,
      names,
      surnames,
      DUI,
      birthday,
      telephone,
      email,
      password: passwordHash,
      hireDate,
      status,
      address,
      photo: photoUrl,
    });

    await newAdministrator.save();

    jsonwebtoken.sign(
      { id: newAdministrator._id },
      config.JWT.secret,
      { expiresIn: config.JWT.expiresIn },
      (error, token) => {
        if (error) console.log(error);
        res.cookie("authToken", token);
      }
    );

    res.status(201).json({
      message: "Administrator registered successfully.",
      administrator: newAdministrator,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      message: "An error occurred while registering",
      error: error.message,
    });
  }
};

export default registerAdministratorsController;
