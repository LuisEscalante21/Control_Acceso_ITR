import mongoose from "mongoose";
import EmployeesModel from "../models/Employees.js";
import CoordinatorsModel from "../models/Coordinators.js";
import AdministratorsModel from "../models/Administrators.js";

export const getUserById = async (req, res) => {
  const { id } = req.params;

  try {
    const isValidObjectId = mongoose.Types.ObjectId.isValid(id);
    let user = null;

    // 🔹 Si el ID es un ObjectId válido, buscamos por _id
    if (isValidObjectId) {
      user =
        (await EmployeesModel.findById(id)) ||
        (await CoordinatorsModel.findById(id)) ||
        (await AdministratorsModel.findById(id));
    }

    // 🔹 Si no es un ObjectId válido, intentamos buscar por id_Employee o id_user
    if (!user) {
      user =
        (await EmployeesModel.findOne({ id_Employee: id })) ||
        (await CoordinatorsModel.findOne({ id_Employee: id })) ||
        (await AdministratorsModel.findOne({ id_Employee: id }));
    }

    if (!user) {
      return res.status(404).json({ message: "Usuario no encontrado" });
    }

    // 🔹 Añadimos de qué colección viene (útil para tu frontend)
    let collectionName = "desconocida";
    if (user.collection.collectionName === "employees") collectionName = "employees";
    if (user.collection.collectionName === "coordinators") collectionName = "coordinators";
    if (user.collection.collectionName === "administrators") collectionName = "administrators";

    return res.json({ ...user.toObject(), collectionName });
  } catch (error) {
    console.error("Error en getUserById:", error);
    res.status(500).json({ message: "Error al obtener usuario", error: error.message });
  }
};

// 🔹 NUEVA FUNCIÓN: Buscar usuario por código de empleado
export const getUserByEmployeeCode = async (req, res) => {
  const { employeeCode } = req.params;

  try {
    if (!employeeCode || !employeeCode.trim()) {
      return res.status(400).json({ 
        found: false, 
        message: "Código de empleado requerido" 
      });
    }

    const code = employeeCode.trim();
    let user = null;
    let userType = null;

    // 🔹 Buscar en empleados
    user = await EmployeesModel.findOne({ numEmpleado: code }).populate("IdTeam").lean();
    if (user) {
      userType = "employee";
    }

    // 🔹 Si no se encontró, buscar en coordinadores
    if (!user) {
      user = await CoordinatorsModel.findOne({ numEmpleado: code }).populate("IdTeam").lean();
      if (user) {
        userType = "coordinator";
      }
    }

    // 🔹 Si no se encontró, buscar en administradores
    if (!user) {
      user = await AdministratorsModel.findOne({ numEmpleado: code }).populate("IdTeam").lean();
      if (user) {
        userType = "administrator";
      }
    }

    // 🔹 Si no se encontró en ninguna colección
    if (!user) {
      return res.status(404).json({
        found: false,
        message: "No se encontró un usuario con ese código de empleado",
      });
    }

    // 🔹 Formatear respuesta con los datos del usuario
    return res.status(200).json({
      found: true,
      userType: userType,
      user: {
        id: user._id,
        name: `${user.names} ${user.surnames}`,
        names: user.names,
        surnames: user.surnames,
        employee_code: user.numEmpleado,
        email: user.email,
        telephone: user.telephone,
        DUI: user.DUI,
        birthday: user.birthday,
        address: user.address,
        gender: user.gender || "",
        area_id: user.IdTeam?._id || "",
        area_name: user.IdTeam?.name || "",
        photo: user.photo || "",
        status: user.status,
      },
    });
  } catch (error) {
    console.error("Error al buscar usuario por código:", error);
    return res.status(500).json({
      found: false,
      message: "Error al buscar usuario",
      error: error.message,
    });
  }
};