// 📁 controllers/coordinatorsController.js
import coordinatorsModel from "../models/Coordinators.js";
import bcryptjs from "bcryptjs";
import { config } from "../config.js";
import { v2 as cloudinary } from "cloudinary";

// 🧰 Configurar Cloudinary
cloudinary.config({
  cloud_name: config.cloudinary.cloudinary_name,
  api_key: config.cloudinary.cloudinary_api_key,
  api_secret: config.cloudinary.cloudinary_api_secret,
});

const coordinatorsController = {};

/* ==========================================================
   📌 GET - Obtener todos los coordinadores
========================================================== */
coordinatorsController.getCoordinators = async (req, res) => {
  try {
    const coordinators = await coordinatorsModel.find().populate("IdTeam");
    res.status(200).json(coordinators);
  } catch (error) {
    res.status(500).json({
      message: "Error al obtener coordinadores",
      error: error.message,
    });
  }
};

/* ==========================================================
   📌 GET - Obtener un coordinador por ID
========================================================== */
coordinatorsController.getCoordinatorById = async (req, res) => {
  try {
    const coordinator = await coordinatorsModel
      .findById(req.params.id)
      .populate("IdTeam");
    if (!coordinator)
      return res.status(404).json({ message: "Coordinador no encontrado" });
    res.status(200).json(coordinator);
  } catch (error) {
    res
      .status(500)
      .json({ message: "Error al obtener coordinador", error: error.message });
  }
};

/* ==========================================================
   🗑️ DELETE - Eliminar coordinador por ID
========================================================== */
coordinatorsController.deleteCoordinator = async (req, res) => {
  try {
    const deleted = await coordinatorsModel.findByIdAndDelete(req.params.id);
    if (!deleted)
      return res.status(404).json({ message: "Coordinador no encontrado" });
    res.status(200).json({ message: "Coordinador eliminado correctamente" });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Error al eliminar coordinador", error: error.message });
  }
};

/* ==========================================================
   🟢 POST - Crear coordinador
========================================================== */
coordinatorsController.createCoordinator = async (req, res) => {
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

    // Validar teléfono y DUI
    const phoneRegex = /^\d{4}-\d{4}$/;
    const duiRegex = /^\d{8}-\d$/;
    if (telephone && !phoneRegex.test(telephone))
      return res
        .status(400)
        .json({ message: "Formato de teléfono inválido. Use ####-####." });
    if (!duiRegex.test(DUI))
      return res
        .status(400)
        .json({ message: "Formato de DUI inválido. Use ########-#." });

    // 🔹 Validar duplicados de DUI y Email
    // ⚠️ numEmpleado ya fue validado por el middleware validateUniqueNumEmpleado
    const [existingDUI, existingEmail] = await Promise.all([
      coordinatorsModel.findOne({ DUI }),
      coordinatorsModel.findOne({ email }),
    ]);

    if (existingDUI)
      return res.status(400).json({ message: "El DUI ya está registrado" });
    if (existingEmail)
      return res
        .status(400)
        .json({ message: "El correo electrónico ya está registrado" });

    // Preparar datos
    const newCoordinatorData = {
      numEmpleado: numEmpleado.trim(),
      names,
      surnames,
      DUI,
      birthday,
      telephone,
      email,
      status,
      address,
    };
    if (IdTeam)
      newCoordinatorData.IdTeam =
        typeof IdTeam === "string" ? IdTeam : IdTeam._id;

    // Hashear contraseña
    newCoordinatorData.password = await bcryptjs.hash(password, 10);

    // Subir imagen si existe
    if (req.file) {
      const result = await cloudinary.uploader.upload(req.file.path, {
        folder: "coordinators",
        allowed_formats: ["jpg", "png", "jpeg"],
      });
      newCoordinatorData.photo = result.secure_url;
    }

    const newCoordinator = await coordinatorsModel.create(newCoordinatorData);
    res.status(201).json({
      message: "Coordinador creado exitosamente",
      coordinator: newCoordinator,
    });
  } catch (error) {
    console.error(error);
    res
      .status(500)
      .json({ message: "Error al crear coordinador", error: error.message });
  }
};

/* ==========================================================
   ✏️ UPDATE - Actualizar coordinador por ID
========================================================== */
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

    const coordinator = await coordinatorsModel.findById(req.params.id);
    if (!coordinator)
      return res.status(404).json({ message: "Coordinador no encontrado" });

    // Validar teléfono y DUI
    const phoneRegex = /^\d{4}-\d{4}$/;
    const duiRegex = /^\d{8}-\d$/;
    if (telephone && !phoneRegex.test(telephone))
      return res
        .status(400)
        .json({ message: "Formato de teléfono inválido. Use ####-####." });
    if (DUI && !duiRegex.test(DUI))
      return res
        .status(400)
        .json({ message: "Formato de DUI inválido. Use ########-#." });

    // 🔹 Validar duplicados solo si cambió
    // ⚠️ numEmpleado ya fue validado por el middleware validateUniqueNumEmpleado
    if (DUI && DUI !== coordinator.DUI) {
      const exists = await coordinatorsModel.findOne({ DUI });
      if (exists)
        return res.status(400).json({ message: "El DUI ya está registrado" });
    }
    if (email && email !== coordinator.email) {
      const exists = await coordinatorsModel.findOne({ email });
      if (exists)
        return res
          .status(400)
          .json({ message: "El correo electrónico ya está registrado" });
    }

    // Preparar datos a actualizar
    const updatedData = {};

    if (numEmpleado) updatedData.numEmpleado = numEmpleado.trim();
    if (names) updatedData.names = names;
    if (surnames) updatedData.surnames = surnames;
    if (DUI) updatedData.DUI = DUI;
    if (birthday) updatedData.birthday = birthday;
    if (telephone) updatedData.telephone = telephone;
    if (email) updatedData.email = email;
    if (status !== undefined) updatedData.status = status;
    if (address) updatedData.address = address;

    if (IdTeam)
      updatedData.IdTeam = typeof IdTeam === "string" ? IdTeam : IdTeam._id;
    if (password) updatedData.password = await bcryptjs.hash(password, 10);

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
    res.status(200).json({
      message: "Coordinador actualizado correctamente",
      coordinator: updatedCoordinator,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      message: "Error al actualizar coordinador",
      error: error.message,
    });
  }
};

export default coordinatorsController;
