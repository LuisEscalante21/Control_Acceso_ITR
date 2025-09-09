import Employee from "../models/Employees.js";

export const getProfile = async (req, res) => {
  try {
    // req.user viene del middleware de autenticación (JWT o session)
    const userId = req.user._id;

    // Buscar en la colección de empleados
    const employee = await Employee.findById(userId).select(
      "numEmpleado names surnames IdTeam photo"
    );

    if (!employee) {
      return res.status(404).json({ message: "Empleado no encontrado" });
    }

    // Unir nombres y apellidos para enviarlo listo al frontend
    const fullName = `${employee.names} ${employee.surnames}`;

    res.json({
      _id: employee._id,
      numEmpleado: employee.numEmpleado,
      fullName,
      IdTeam: employee.IdTeam || null, // enviar IdTeam para obtener el nombre del equipo
      photo: employee.photo || "",
    });
  } catch (error) {
    console.error("Error obteniendo perfil:", error);
    res.status(500).json({ message: "Error al obtener perfil" });
  }
};