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

    if (!employee) {
      return res.json({ message: "Empleado no existe", employee: null });
    }

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
    return res.status(200).json(result);
  } catch (error) {
    res.status(500).json({ message: "Error obteniendo empleado(s)", error });
  }
};

// C R E A T E - Crear nuevo empleado
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

    // Validar que los campos requeridos estén presentes
    if (!numEmpleado || !names || !surnames || !DUI || !email || !password) {
      return res.status(400).json({ message: "Faltan campos requeridos" });
    }

    // Validar formatos
    const phoneRegex = /^\d{4}-\d{4}$/;
    const duiRegex = /^\d{8}-\d$/;

    if (telephone && !phoneRegex.test(telephone)) {
      return res.status(400).json({ message: "Formato de teléfono inválido. Use ####-####." });
    }

    if (!duiRegex.test(DUI)) {
      return res.status(400).json({ message: "Formato de DUI inválido. Use ########-#." });
    }

    // ✅ Validar que el número de empleado no exista
    const existingNumEmpleado = await employeesModel.findOne({ numEmpleado });
    if (existingNumEmpleado) {
      return res.status(400).json({ message: "El número de empleado ya está registrado" });
    }

    // ✅ Validar que el DUI no exista
    const existingDUI = await employeesModel.findOne({ DUI });
    if (existingDUI) {
      return res.status(400).json({ message: "El DUI ya está registrado" });
    }

    // ✅ Validar que el correo electrónico no exista
    const existingEmail = await employeesModel.findOne({ email });
    if (existingEmail) {
      return res.status(400).json({ message: "El correo electrónico ya está registrado" });
    }

    // Preparar datos del empleado
    const newEmployeeData = {
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

    // Agregar IdTeam si viene
    if (IdTeam) {
      if (typeof IdTeam === "string") {
        newEmployeeData.IdTeam = IdTeam;
      } else if (typeof IdTeam === "object" && IdTeam._id) {
        newEmployeeData.IdTeam = IdTeam._id;
      }
    }

    // Hashear la contraseña
    newEmployeeData.password = await bcryptjs.hash(password, 10);

    // 📸 Subir imagen si viene en el request
    if (req.file) {
      const result = await cloudinary.uploader.upload(req.file.path, {
        folder: "employees",
        allowed_formats: ["jpg", "png", "jpeg"],
      });
      newEmployeeData.photo = result.secure_url;
    }

    // Crear el empleado
    const newEmployee = await employeesModel.create(newEmployeeData);

    res.status(201).json({ message: "Empleado creado exitosamente", employee: newEmployee });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error al crear empleado", error: error.message });
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

    // Obtener el empleado actual para comparar
    const currentEmployee = await employeesModel.findById(req.params.id);
    if (!currentEmployee) {
      return res.status(404).json({ message: "Empleado no encontrado" });
    }

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

    // Validar formatos
    const phoneRegex = /^\d{4}-\d{4}$/;
    const duiRegex = /^\d{8}-\d$/;

    if (telephone && !phoneRegex.test(telephone)) {
      return res.status(400).json({ message: "Formato de teléfono inválido. Use ####-####." });
    }

    if (DUI && !duiRegex.test(DUI)) {
      return res.status(400).json({ message: "Formato de DUI inválido. Use ########-#." });
    }

    // ✅ Validar que el número de empleado no exista (si es diferente al actual)
    if (numEmpleado && numEmpleado !== currentEmployee.numEmpleado) {
      const existingNumEmpleado = await employeesModel.findOne({ numEmpleado });
      if (existingNumEmpleado) {
        return res.status(400).json({ message: "El número de empleado ya está registrado" });
      }
    }

    // ✅ Validar que el DUI no exista (si es diferente al actual)
    if (DUI && DUI !== currentEmployee.DUI) {
      const existingDUI = await employeesModel.findOne({ DUI });
      if (existingDUI) {
        return res.status(400).json({ message: "El DUI ya está registrado" });
      }
    }

    // ✅ Validar que el correo electrónico no exista (si es diferente al actual)
    if (email && email !== currentEmployee.email) {
      const existingEmail = await employeesModel.findOne({ email });
      if (existingEmail) {
        return res.status(400).json({ message: "El correo electrónico ya está registrado" });
      }
    }

    // Solo agregar IdTeam si viene como string
    if (IdTeam) {
      if (typeof IdTeam === "string") {
        updatedData.IdTeam = IdTeam;
      } else if (typeof IdTeam === "object" && IdTeam._id) {
        updatedData.IdTeam = IdTeam._id;
      }
      // Si no es string ni objeto con _id, no lo agregamos
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