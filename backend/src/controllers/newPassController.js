import bcryptjs from "bcryptjs";
import EmployeesModel from "../models/Employees.js";
import CoordinatorsModel from "../models/Coordinators.js";
import AdministratorsModel from "../models/Administrators.js";

// Reglas: min 8, mayúscula, minúscula, dígito, SIN espacios. Sí permite símbolos.
const noSpaces = /^\S+$/;
const hasUpper = /[A-Z]/;
const hasLower = /[a-z]/;
const hasDigit = /[0-9]/;

function setFlagFalse(doc) {
  doc.updatePassStatus = false;
  if (typeof doc.updatePassBoolean !== "undefined") doc.updatePassBoolean = false;
}

/**
 * POST /api/forcePasswordUpdate
 * requiere cookie JWT (requireAuth)
 * body: { newPassword }
 */
export const forcePasswordUpdateController = async (req, res) => {
  try {
    const { newPassword } = req.body || {};
    if (!newPassword) return res.status(400).json({ message: "Nueva contraseña requerida" });

    if (
      newPassword.length < 8 ||
      !noSpaces.test(newPassword) ||
      !hasUpper.test(newPassword) ||
      !hasLower.test(newPassword) ||
      !hasDigit.test(newPassword)
    ) {
      return res.status(400).json({
        message:
          "La contraseña debe tener mínimo 8 caracteres, incluir mayúscula, minúscula y número. Puede incluir símbolos, pero no espacios.",
      });
    }

    const { id } = req.user || {};
    if (!id) return res.status(401).json({ message: "No autorizado" });

    const user =
      (await EmployeesModel.findById(id)) ||
      (await CoordinatorsModel.findById(id)) ||
      (await AdministratorsModel.findById(id));

    if (!user) return res.status(404).json({ message: "Usuario no encontrado" });

    user.password = await bcryptjs.hash(newPassword, 12);
    setFlagFalse(user);
    await user.save();

    return res.json({ message: "Contraseña actualizada" });
  } catch (err) {
    console.error("forcePasswordUpdateController error:", err);
    return res.status(500).json({ message: "Error interno" });
  }
};

export default { forcePasswordUpdateController };
