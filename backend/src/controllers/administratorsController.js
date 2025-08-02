import administratorsModel from "../models/Administrators.js";
import bcryptjs from "bcryptjs";
import { config } from "../config.js";
import { v2 as cloudinary } from "cloudinary";

// Configurar cloudinary (si no está configurado globalmente)
cloudinary.config({
  cloud_name: config.cloudinary.cloudinary_name,
  api_key: config.cloudinary.cloudinary_api_key,
  api_secret: config.cloudinary.cloudinary_api_secret,
});

const administratorsController = {};

// S E L E C T - Obtener todos los administradores
administratorsController.getAdministrators = async (req, res) => {
  try {
    const administrators = await administratorsModel.find();
    res.status(200).json(administrators);
  } catch (error) {
    res.status(500).json({
      message: "Error al obtener administradores",
      error,
    });
  }
};

// D E L E T E - Eliminar administrador por ID
administratorsController.deleteAdministrator = async (req, res) => {
  try {
    const deleted = await administratorsModel.findByIdAndDelete(req.params.id);
    if (!deleted) {
      return res.status(404).json({ message: "Administrador no encontrado" });
    }
    res.status(200).json({ message: "Administrador eliminado correctamente" });
  } catch (error) {
    res.status(500).json({
      message: "Error al eliminar administrador",
      error,
    });
  }
};

// U P D A T E - Actualizar administrador por ID con imagen y manejo IdTeam
administratorsController.updateAdministrator = async (req, res) => {
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

    // Validar teléfono (formato 1234-5678)
    const phoneRegex = /^\d{4}-\d{4}$/;
    if (telephone && !phoneRegex.test(telephone)) {
      return res
        .status(400)
        .json({ message: "Formato de teléfono inválido. Use ####-####." });
    }

    // Validar DUI (formato 12345678-9)
    const duiRegex = /^\d{8}-\d$/;
    if (DUI && !duiRegex.test(DUI)) {
      return res
        .status(400)
        .json({ message: "Formato de DUI inválido. Use ########-#." });
    }

    // Preparar los datos a actualizar
    const updatedData = {
      numEmpleado,
      names,
      surnames,
      DUI,
      birthday,
      telephone,
      email,
      hireDate,
      status,
      address,
    };

    // Manejo de IdTeam para que acepte string o objeto con _id
    if (IdTeam) {
      if (typeof IdTeam === "string") {
        updatedData.IdTeam = IdTeam;
      } else if (typeof IdTeam === "object" && IdTeam._id) {
        updatedData.IdTeam = IdTeam._id;
      }
    }

    // Si hay nueva contraseña, hashearla
    if (password) {
      updatedData.password = await bcryptjs.hash(password, 10);
    }

    // Subir imagen si viene en el request (req.file)
    if (req.file) {
      const result = await cloudinary.uploader.upload(req.file.path, {
        folder: "administrators",
        allowed_formats: ["jpg", "png", "jpeg"],
      });
      updatedData.photo = result.secure_url;
    }

    const updatedAdministrator = await administratorsModel.findByIdAndUpdate(
      req.params.id,
      updatedData,
      { new: true }
    );

    if (!updatedAdministrator) {
      return res.status(404).json({ message: "Administrador no encontrado" });
    }

    res.status(200).json({
      message: "Administrador actualizado correctamente",
      administrator: updatedAdministrator,
    });
  } catch (error) {
    res.status(500).json({
      message: "Error al actualizar administrador",
      error: error.message,
    });
  }
};

export default administratorsController;