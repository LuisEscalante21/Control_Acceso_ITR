import administratorsModel from "../models/Administrators.js";
import coordinatorsModel from "../models/Coordinators.js";
import employeesModel from "../models/Employees.js";

export const validateUniqueNumEmpleado = (
  currentCollection,
  isUpdate = false
) => {
  return async (req, res, next) => {
    try {
      const { numEmpleado } = req.body;
      if (!numEmpleado) return next();

      const numEmpleadoTrim = numEmpleado.trim().toUpperCase(); // convertir a mayúsculas para comparación uniforme

      let currentRecordId = isUpdate ? req.params.id : null;

      // Buscar en todas las colecciones con case-insensitive
      const existsInAdmins = await administratorsModel.findOne({
        numEmpleado: { $regex: `^${numEmpleadoTrim}$`, $options: "i" },
        ...(isUpdate && { _id: { $ne: currentRecordId } }),
      });

      const existsInCoords = await coordinatorsModel.findOne({
        numEmpleado: { $regex: `^${numEmpleadoTrim}$`, $options: "i" },
        ...(isUpdate && { _id: { $ne: currentRecordId } }),
      });

      const existsInEmployees = await employeesModel.findOne({
        numEmpleado: { $regex: `^${numEmpleadoTrim}$`, $options: "i" },
        ...(isUpdate && { _id: { $ne: currentRecordId } }),
      });

      if (existsInAdmins || existsInCoords || existsInEmployees) {
        let collectionName = existsInAdmins
          ? "Administradores"
          : existsInCoords
          ? "Coordinadores"
          : "Empleados";

        return res.status(400).json({
          message: `El número de empleado '${numEmpleadoTrim}' ya está registrado en ${collectionName}`,
        });
      }

      next();
    } catch (error) {
      console.error("Error middleware validateUniqueNumEmpleado:", error);
      return res.status(500).json({
        message: "Error al validar número de empleado",
        error: error.message,
      });
    }
  };
};
