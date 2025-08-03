import employeesModel from "../models/Employees.js";
import bcryptjs from "bcryptjs";
import { config } from "../config.js";
import { v2 as cloudinary } from "cloudinary";

// Configurar cloudinary (si aún no está configurado globalmente)
cloudinary.config({
  cloud_name: config.cloudinary.cloudinary_name,
  api_key: config.cloudinary.cloudinary_api_key,
  api_secret: config.cloudinary.cloudinary_api_secret,
});

const employeesController = {};

// S E L E C T - Obtener todos los empleados
employeesController.getEmployees = async (req, res) => {
  try {
    const employees = await employeesModel.find().populate("IdTeam");
    res.json(employees);
  } catch (error) {
    res.status(500).json({ message: "Error fetching employees", error });
  }
};

// Obtener empleado por id (parametro)
employeesController.getEmployeeById = async (req, res) => {
  try {
    const employee = await employeesModel.findById(req.params.id).populate("IdTeam");
    if (!employee) return res.status(404).json({ message: "Empleado no encontrado" });
    res.json(employee);
  } catch (error) {
    res.status(500).json({ message: "Error obteniendo empleado", error });
  }
};

// G E T  P O R  T E A M
employeesController.getEmployee = async (req, res) => {
  const { teamId } = req.query;

  if (!teamId) {
    return res.status(400).json({ message: "Debe proporcionar 'teamId'" });
  }

  try {
    const result = await employeesModel.find({ IdTeam: teamId }).populate("IdTeam");

    if (!result || result.length === 0) {
      return res.status(404).json({ message: "Empleado(s) no encontrado(s)" });
    }

    res.json(result);
  } catch (error) {
    res.status(500).json({ message: "Error obteniendo empleado(s)", error });
  }
};


// D E L E T E - Eliminar empleado por ID
employeesController.deleteEmployees = async (req, res) => {
  try {
    const deleted = await employeesModel.findByIdAndDelete(req.params.id);
    if (!deleted) {
      return res.status(404).json({ message: "Empleado no encontrado" });
    }
    res.json({ message: "Empleado eliminado" });
  } catch (error) {
    res.status(500).json({ message: "Error al eliminar empleado", error });
  }
};

// U P D A T E - Actualizar empleado por ID
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

     // Solo agregar IdTeam si viene como string
    if (IdTeam) {
      if (typeof IdTeam === "string") {
        updatedData.IdTeam = IdTeam;
      } else if (typeof IdTeam === "object" && IdTeam._id) {
        updatedData.IdTeam = IdTeam._id;
      }
      // Si no es string ni objeto con _id, no lo agregamos
    }

    // Validar formatos
    const phoneRegex = /^\d{4}-\d{4}$/;
    const duiRegex = /^\d{8}-\d$/;

    if (telephone && !phoneRegex.test(telephone)) {
      return res.status(400).json({ message: "Formato de teléfono inválido. Use ####-####." });
    }

    if (DUI && !duiRegex.test(DUI)) {
      return res.status(400).json({ message: "Formato de DUI inválido. Use ########-#." });
    }

    // Hashear la contraseña si se proporciona
    if (password) {
      updatedData.password = await bcryptjs.hash(password, 10);
    }

    // 📸 Subir imagen si viene en el request
    if (req.file) {
      const result = await cloudinary.uploader.upload(req.file.path, {
        folder: "employees",
        allowed_formats: ["jpg", "png", "jpeg"],
      });
      updatedData.photo = result.secure_url;
    }

    const updatedEmployee = await employeesModel.findByIdAndUpdate(
      req.params.id,
      updatedData,
      { new: true }
    );

    if (!updatedEmployee) {
      return res.status(404).json({ message: "Empleado no encontrado" });
    }

    res.json({ message: "Empleado actualizado", employee: updatedEmployee });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error al actualizar empleado", error: error.message });
  }
};


export default employeesController;
