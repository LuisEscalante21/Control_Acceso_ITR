// 📁 controllers/administratorsController.js
import administratorsModel from "../models/Administrators.js";
import bcryptjs from "bcryptjs";
import { config } from "../config.js";
import { v2 as cloudinary } from "cloudinary";

// 🧰 Configurar Cloudinary
cloudinary.config({
  cloud_name: config.cloudinary.cloudinary_name,
  api_key: config.cloudinary.cloudinary_api_key,
  api_secret: config.cloudinary.cloudinary_api_secret,
});

const administratorsController = {};

/* ==========================================================
   📌 GET - Obtener todos los administradores
========================================================== */
administratorsController.getAdministrators = async (req, res) => {
  try {
    const administrators = await administratorsModel.find().populate("IdTeam");
    res.status(200).json(administrators);
  } catch (error) {
    res.status(500).json({
      message: "Error al obtener administradores",
      error: error.message,
    });
  }
};

/* ==========================================================
   📌 GET - Obtener un administrador por ID
========================================================== */
administratorsController.getAdministratorById = async (req, res) => {
  try {
    const administrator = await administratorsModel
      .findById(req.params.id)
      .populate("IdTeam");
    if (!administrator)
      return res.status(404).json({ message: "Administrador no encontrado" });
    res.status(200).json(administrator);
  } catch (error) {
    res
      .status(500)
      .json({ message: "Error al buscar administrador", error: error.message });
  }
};

/* ==========================================================
   🗑️ DELETE - Eliminar administrador por ID
========================================================== */
administratorsController.deleteAdministrator = async (req, res) => {
  try {
    const deleted = await administratorsModel.findByIdAndDelete(req.params.id);
    if (!deleted)
      return res.status(404).json({ message: "Administrador no encontrado" });
    res.status(200).json({ message: "Administrador eliminado correctamente" });
  } catch (error) {
    res.status(500).json({
      message: "Error al eliminar administrador",
      error: error.message,
    });
  }
};

/* ==========================================================
   🟢 POST - Crear administrador
========================================================== */
administratorsController.createAdministrator = async (req, res) => {
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

    // Validaciones de formato
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
      administratorsModel.findOne({ DUI }),
      administratorsModel.findOne({ email }),
    ]);

    if (existingDUI)
      return res.status(400).json({ message: "El DUI ya está registrado" });
    if (existingEmail)
      return res
        .status(400)
        .json({ message: "El correo electrónico ya está registrado" });

    // Preparar datos
    const newAdminData = {
      numEmpleado: numEmpleado.trim(),
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

    if (IdTeam) {
      newAdminData.IdTeam = typeof IdTeam === "string" ? IdTeam : IdTeam._id;
    }

    // Hashear contraseña
    newAdminData.password = await bcryptjs.hash(password, 10);

    // Subir imagen si existe
    if (req.file) {
      const result = await cloudinary.uploader.upload(req.file.path, {
        folder: "administrators",
        allowed_formats: ["jpg", "png", "jpeg"],
      });
      newAdminData.photo = result.secure_url;
    }

    const newAdmin = await administratorsModel.create(newAdminData);
    res.status(201).json({
      message: "Administrador creado exitosamente",
      administrator: newAdmin,
    });
  } catch (error) {
    console.error(error);
    res
      .status(500)
      .json({ message: "Error al crear administrador", error: error.message });
  }
};

/* ==========================================================
   ✏️ UPDATE - Actualizar administrador por ID
========================================================== */
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

    const administrator = await administratorsModel.findById(req.params.id);
    if (!administrator)
      return res.status(404).json({ message: "Administrador no encontrado" });

    // Validaciones de formato
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
    if (DUI && DUI !== administrator.DUI) {
      const exists = await administratorsModel.findOne({ DUI });
      if (exists)
        return res.status(400).json({ message: "El DUI ya está registrado" });
    }
    if (email && email !== administrator.email) {
      const exists = await administratorsModel.findOne({ email });
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
    if (hireDate) updatedData.hireDate = hireDate;
    if (status !== undefined) updatedData.status = status;
    if (address) updatedData.address = address;

    if (IdTeam)
      updatedData.IdTeam = typeof IdTeam === "string" ? IdTeam : IdTeam._id;

    if (password) updatedData.password = await bcryptjs.hash(password, 10);

    if (req.file) {
      const result = await cloudinary.uploader.upload(req.file.path, {
        folder: "administrators",
        allowed_formats: ["jpg", "png", "jpeg"],
      });
      updatedData.photo = result.secure_url;
    }

    const updatedAdmin = await administratorsModel.findByIdAndUpdate(
      req.params.id,
      updatedData,
      { new: true }
    );
    res.status(200).json({
      message: "Administrador actualizado correctamente",
      administrator: updatedAdmin,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      message: "Error al actualizar administrador",
      error: error.message,
    });
  }
};

export default administratorsController;
