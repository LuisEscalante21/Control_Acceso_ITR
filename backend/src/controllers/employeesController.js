// 📁 controllers/employeesController.js
import employeesModel from "../models/Employees.js";
import bcryptjs from "bcryptjs";
import { config } from "../config.js";
import { v2 as cloudinary } from "cloudinary";
import fs from "fs";

// 🔧 Configurar Cloudinary (si no está configurado globalmente)
cloudinary.config({
  cloud_name: config.cloudinary.cloudinary_name,
  api_key: config.cloudinary.cloudinary_api_key,
  api_secret: config.cloudinary.cloudinary_api_secret,
});

const employeesController = {};

/* ===========================================================
   📘 GET - Obtener todos los empleados
=========================================================== */
employeesController.getEmployees = async (req, res) => {
  try {
    const employees = await employeesModel.find().populate("IdTeam");
    res.status(200).json(employees);
  } catch (error) {
    res.status(500).json({
      message: "Error al obtener empleados",
      error: error.message,
    });
  }
};

/* ===========================================================
   📘 GET - Obtener empleado por ID
=========================================================== */
employeesController.getEmployeeById = async (req, res) => {
  try {
    const employee = await employeesModel
      .findById(req.params.id)
      .populate("IdTeam");

    if (!employee) {
      return res.status(404).json({ message: "Empleado no encontrado" });
    }

    res.status(200).json(employee);
  } catch (error) {
    res.status(500).json({
      message: "Error al obtener empleado",
      error: error.message,
    });
  }
};

/* ===========================================================
   📘 GET - Obtener empleados por equipo (Team)
=========================================================== */
employeesController.getEmployee = async (req, res) => {
  const { teamId } = req.query;

  if (!teamId) {
    return res.status(400).json({ message: "Debe proporcionar 'teamId'" });
  }

  try {
    const result = await employeesModel
      .find({ IdTeam: teamId })
      .populate("IdTeam");
    res.status(200).json(result);
  } catch (error) {
    res.status(500).json({
      message: "Error al obtener empleados por equipo",
      error: error.message,
    });
  }
};

/* ===========================================================
   🟢 POST - Crear nuevo empleado
=========================================================== */
employeesController.createEmployees = async (req, res) => {
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

    // 1️⃣ Validar campos obligatorios
    if (!numEmpleado || !names || !surnames || !DUI || !email || !password) {
      return res.status(400).json({ message: "Faltan campos requeridos" });
    }

    // 2️⃣ Limpiar y validar formato de numEmpleado
    const numEmpleadoTrim = numEmpleado.trim();
    const employeeCodeRegex = /^[A-Za-z]{2}\d{2}$/; // Ejemplo: CB01
    if (!employeeCodeRegex.test(numEmpleadoTrim)) {
      return res.status(400).json({
        message:
          "El código de empleado debe tener 2 letras seguidas de 2 números. Ejemplo: CB01",
      });
    }

    // 3️⃣ Validar formatos de teléfono y DUI
    const phoneRegex = /^\d{4}-\d{4}$/;
    const duiRegex = /^\d{8}-\d$/;

    if (telephone && !phoneRegex.test(telephone)) {
      return res
        .status(400)
        .json({ message: "Formato de teléfono inválido. Use ####-####." });
    }
    if (!duiRegex.test(DUI)) {
      return res
        .status(400)
        .json({ message: "Formato de DUI inválido. Use ########-#." });
    }

    // 4️⃣ Validar duplicados de DUI y Email
    // ⚠️ numEmpleado ya fue validado por el middleware validateUniqueNumEmpleado
    const [existingDUI, existingEmail] = await Promise.all([
      employeesModel.findOne({ DUI }),
      employeesModel.findOne({ email }),
    ]);

    if (existingDUI)
      return res.status(400).json({ message: "El DUI ya está registrado" });
    if (existingEmail)
      return res
        .status(400)
        .json({ message: "El correo electrónico ya está registrado" });

    // 5️⃣ Construir datos del empleado
    const newEmployeeData = {
      numEmpleado: numEmpleadoTrim,
      names: names.trim(),
      surnames: surnames.trim(),
      DUI,
      birthday,
      telephone,
      email: email.trim().toLowerCase(),
      hireDate,
      status,
      address,
    };

    // Asociar IdTeam
    if (IdTeam) {
      if (typeof IdTeam === "string") newEmployeeData.IdTeam = IdTeam;
      else if (typeof IdTeam === "object" && IdTeam._id)
        newEmployeeData.IdTeam = IdTeam._id;
    }

    // 6️⃣ Hashear contraseña
    newEmployeeData.password = await bcryptjs.hash(password, 10);

    // 7️⃣ Subir imagen a Cloudinary
    if (req.file) {
      const result = await cloudinary.uploader.upload(req.file.path, {
        folder: "employees",
        allowed_formats: ["jpg", "png", "jpeg"],
      });
      newEmployeeData.photo = result.secure_url;
      if (fs.existsSync(req.file.path)) fs.unlinkSync(req.file.path);
    }

    // 8️⃣ Crear empleado
    const newEmployee = await employeesModel.create(newEmployeeData);

    res.status(201).json({
      message: "Empleado creado exitosamente",
      employee: newEmployee,
    });
  } catch (error) {
    console.error("❌ Error al crear empleado:", error);
    res.status(500).json({
      message: "Error al crear empleado",
      error: error.message,
    });
  }
};

/* ===========================================================
   🟡 PUT - Actualizar empleado
=========================================================== */
employeesController.updateEmployees = async (req, res) => {
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

    const currentEmployee = await employeesModel.findById(req.params.id);
    if (!currentEmployee) {
      return res.status(404).json({ message: "Empleado no encontrado" });
    }

    const updatedData = {};

    // ✅ Validar formato de numEmpleado (si viene en el body)
    // ⚠️ La unicidad ya fue validada por el middleware validateUniqueNumEmpleado
    if (numEmpleado) {
      const numEmpleadoTrim = numEmpleado.trim();
      const employeeCodeRegex = /^[A-Za-z]{2}\d{2}$/;
      if (!employeeCodeRegex.test(numEmpleadoTrim)) {
        return res.status(400).json({
          message:
            "El código de empleado debe tener 2 letras seguidas de 2 números. Ejemplo: CB01",
        });
      }
      updatedData.numEmpleado = numEmpleadoTrim;
    }

    // ✅ Validar y actualizar otros campos
    if (names) updatedData.names = names.trim();
    if (surnames) updatedData.surnames = surnames.trim();
    if (birthday) updatedData.birthday = birthday;

    if (telephone) {
      const phoneRegex = /^\d{4}-\d{4}$/;
      if (!phoneRegex.test(telephone)) {
        return res
          .status(400)
          .json({ message: "Formato de teléfono inválido. Use ####-####." });
      }
      updatedData.telephone = telephone;
    }

    if (email && email !== currentEmployee.email) {
      const exists = await employeesModel.findOne({ email });
      if (exists)
        return res
          .status(400)
          .json({ message: "El correo electrónico ya está registrado" });
      updatedData.email = email.trim().toLowerCase();
    }

    if (DUI && DUI !== currentEmployee.DUI) {
      const duiRegex = /^\d{8}-\d$/;
      if (!duiRegex.test(DUI)) {
        return res
          .status(400)
          .json({ message: "Formato de DUI inválido. Use ########-#." });
      }
      const exists = await employeesModel.findOne({ DUI });
      if (exists)
        return res.status(400).json({ message: "El DUI ya está registrado" });
      updatedData.DUI = DUI;
    }

    if (hireDate) updatedData.hireDate = hireDate;
    if (status !== undefined) updatedData.status = status;
    if (address) updatedData.address = address;

    if (IdTeam) {
      if (typeof IdTeam === "string") updatedData.IdTeam = IdTeam;
      else if (typeof IdTeam === "object" && IdTeam._id)
        updatedData.IdTeam = IdTeam._id;
    }

    if (password) {
      updatedData.password = await bcryptjs.hash(password, 10);
    }

    // ✅ Subir nueva foto
    if (req.file) {
      const result = await cloudinary.uploader.upload(req.file.path, {
        folder: "employees",
        allowed_formats: ["jpg", "png", "jpeg"],
      });
      updatedData.photo = result.secure_url;
      if (fs.existsSync(req.file.path)) fs.unlinkSync(req.file.path);
    }

    const updatedEmployee = await employeesModel.findByIdAndUpdate(
      req.params.id,
      updatedData,
      { new: true }
    );

    res.status(200).json({
      message: "Empleado actualizado correctamente",
      employee: updatedEmployee,
    });
  } catch (error) {
    console.error("❌ Error al actualizar empleado:", error);
    res.status(500).json({
      message: "Error al actualizar empleado",
      error: error.message,
    });
  }
};

/* ===========================================================
   🔴 DELETE - Eliminar empleado
=========================================================== */
employeesController.deleteEmployees = async (req, res) => {
  try {
    const deleted = await employeesModel.findByIdAndDelete(req.params.id);
    if (!deleted) {
      return res.status(404).json({ message: "Empleado no encontrado" });
    }
    res.status(200).json({ message: "Empleado eliminado correctamente" });
  } catch (error) {
    res.status(500).json({
      message: "Error al eliminar empleado",
      error: error.message,
    });
  }
};

export default employeesController;
