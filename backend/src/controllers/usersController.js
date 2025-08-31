import EmployeesModel from "../models/Employees.js";
import CoordinatorsModel from "../models/Coordinators.js";
import AdministratorsModel from "../models/Administrators.js";

export const getUserById = async (req, res) => {
  const { id } = req.params;

  try {
    let user = await EmployeesModel.findById(id);
    if (user) return res.json({ ...user.toObject(), collectionName: "employees" });

    user = await CoordinatorsModel.findById(id);
    if (user) return res.json({ ...user.toObject(), collectionName: "coordinators" });

    user = await AdministratorsModel.findById(id);
    if (user) return res.json({ ...user.toObject(), collectionName: "administrators" });

    return res.status(404).json({ message: "Usuario no encontrado" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error al obtener usuario", error: error.message });
  }
};
