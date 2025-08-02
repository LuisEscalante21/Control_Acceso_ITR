import coordinatorsModel from "../models/Coordinators.js";
import bcryptjs from "bcryptjs";
import { config } from "../config.js";
import { v2 as cloudinary } from "cloudinary";

// Configurar cloudinary (si no está configurado globalmente)
cloudinary.config({
  cloud_name: config.cloudinary.cloudinary_name,
  api_key: config.cloudinary.cloudinary_api_key,
  api_secret: config.cloudinary.cloudinary_api_secret,
});

const coordinatorsController = {};

// S E L E C T - Obtener todos los coordinadores
coordinatorsController.getCoordinators = async (req, res) => {
  try {
    const coordinators = await coordinatorsModel.find();
    res.json(coordinators);
  } catch (error) {
    res.status(500).json({ message: "Error al obtener coordinadores", error });
  }
};

// D E L E T E - Eliminar coordinador por ID
coordinatorsController.deleteCoordinator = async (req, res) => {
  try {
    const deleted = await coordinatorsModel.findByIdAndDelete(req.params.id);
    if (!deleted) {
      return res.status(404).json({ message: "Coordinador no encontrado" });
    }
    res.json({ message: "Coordinador eliminado correctamente" });
  } catch (error) {
    res.status(500).json({ message: "Error al eliminar coordinador", error });
  }
};

// U P D A T E - Actualizar coordinador por ID con imagen y manejo IdTeam
coordinatorsController.updateCoordinator = async (req, res) => {
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
      IdTeam,
      status,
      address,
    } = req.body;

    // Validar teléfono (formato 1234-5678)
    const phoneRegex = /^\d{4}-\d{4}$/;
    if (telephone && !phoneRegex.test(telephone)) {
      return res.status(400).json({ message: "Formato de teléfono inválido. Use ####-####." });
    }

    // Validar DUI (formato 12345678-9)
    const duiRegex = /^\d{8}-\d$/;
    if (DUI && !duiRegex.test(DUI)) {
      return res.status(400).json({ message: "Formato de DUI inválido. Use ########-#." });
    }

    // Preparar datos a actualizar
    const updatedData = {
      numEmpleado,
      names,
      surnames,
      DUI,
      birthday,
      telephone,
      email,
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

    // Hashear la contraseña si se proporciona
    if (password) {
      updatedData.password = await bcryptjs.hash(password, 10);
    }

    // Subir imagen si viene en el request (req.file)
    if (req.file) {
      const result = await cloudinary.uploader.upload(req.file.path, {
        folder: "coordinators",
        allowed_formats: ["jpg", "png", "jpeg"],
      });
      updatedData.photo = result.secure_url;
    }

    const updatedCoordinator = await coordinatorsModel.findByIdAndUpdate(
      req.params.id,
      updatedData,
      { new: true }
    );

    if (!updatedCoordinator) {
      return res.status(404).json({ message: "Coordinador no encontrado" });
    }

    res.json({
      message: "Coordinador actualizado correctamente",
      coordinator: updatedCoordinator,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error al actualizar coordinador", error: error.message });
  }
};

export default coordinatorsController;
