import Coordinator from "../models/Coordinators.js";
import bcryptjs from "bcryptjs";
import jsonwebtoken from "jsonwebtoken";
import { config } from "../config.js";
import { v2 as cloudinary } from "cloudinary";

// Configurar cloudinary
cloudinary.config({
  cloud_name: config.cloudinary.cloudinary_name,
  api_key: config.cloudinary.cloudinary_api_key,
  api_secret: config.cloudinary.cloudinary_api_secret,
});

const registerCoordinatorsController = {};

// I N S E R T
registerCoordinatorsController.register = async (req, res) => {
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
      address
    } = req.body;

    if (!numEmpleado || !names || !surnames || !DUI || !birthday ||
        !telephone || !email || !password || !hireDate || !IdTeam || !status || !address) {
      return res.json(500)({ message: "all fields are required" });
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

    // Verificar unicidad de email
    const existEmail = await Administrator.findOne({ email });
    if (existEmail) {
      return res.status(400).json({ message: "Email already exists." });
    }

    // Verificar unicidad de teléfono
    const existPhone = await Administrator.findOne({ telephone });
    if (existPhone) {
      return res.status(400).json({ message: "Telephone already exists." });
    }

    // Verificar unicidad de DUI
    const existDUI = await Administrator.findOne({ DUI });
    if (existDUI) {
      return res.status(400).json({ message: "DUI already exists." });
    }

    // Verifica si existe el coordinador
    const existCoordinator = await Coordinator.findOne({ email });
    if (existCoordinator) {
      return res.status(400).json({ message: "coordinator already exists" });
    }

    const passwordHash = await bcryptjs.hash(password, 10);

    // Subir foto a cloudinary si existe
    let photoUrl = "";
    if (req.file) {
      const result = await cloudinary.uploader.upload(req.file.path, {
        folder: "coordinators",
        allowed_formats: ["jpg", "png", "jpeg"],
      });
      photoUrl = result.secure_url;
    }

    const newCoordinator = new Coordinator({
      numEmpleado,
      names,
      surnames,
      DUI,
      birthday,
      telephone,
      email,
      password: passwordHash,
      hireDate,
      IdTeam,
      status,
      address,
      photo: photoUrl,
    });
    await newCoordinator.save();

    jsonwebtoken.sign(
      { id: newCoordinator._id },
      config.JWT.secret,
      { expiresIn: config.JWT.expiresIn },
      (error, token) => {
        if (error) console.log(error);
        res.cookie("authToken", token);
      }
    );
     res.status(201).json({
      message: "coordinator registered successfully",
      coordinator: newCoordinator,
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({
      message: "error registering coordinator",
      error: error.message,
    });
  }
};

export default registerCoordinatorsController;