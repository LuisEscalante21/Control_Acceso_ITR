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
