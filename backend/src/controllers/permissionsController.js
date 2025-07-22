import PermissionsModel from "../models/Permissions.js";

const permissionsController = {};

// Crear un nuevo permiso
permissionsController.InsertPermission = async (req, res) => {
  try {
    const user = req.user;

    if (!user) {
      return res.status(401).json({ message: "No autorizado. Inicia sesión." });
    }

    const { permissionType } = req.body;

    const permissionData = {
      ...req.body,
      employeeNumber: user.numEmpleado,
      employeeName: `${user.names} ${user.surnames}`,
      department: user.department,
      idTeam: user.IdTeam,
      createdBy: user._id,
    };

    // Validaciones generales
    if (!permissionData.applicationDay) {
      return res.status(400).json({ message: "El día de solicitud es obligatorio." });
    }

    if (typeof permissionData.Discount !== "boolean") {
      return res.status(400).json({ message: "El campo Discount debe ser booleano." });
    }

    if (permissionData.Discount && (typeof permissionData.quantityDiscount !== "number" || permissionData.quantityDiscount < 0)) {
      return res.status(400).json({ message: "Cantidad de descuento inválida." });
    }

    // Validaciones por tipo de permiso
    if (permissionType === "minor") {
      if (!permissionData.permissionDate || !permissionData.startTime || !permissionData.endTime) {
        return res.status(400).json({ message: "Campos requeridos para permiso menor faltantes." });
      }
    }

    if (permissionType === "major") {
      if (!permissionData.permissionDateFrom || !permissionData.permissionDateTo) {
        return res.status(400).json({ message: "Fechas requeridas para permiso mayor." });
      }
      if (!permissionData.requestLetter || !Array.isArray(permissionData.supportingDocuments) || permissionData.supportingDocuments.length === 0) {
        return res.status(400).json({ message: "Carta y documentos requeridos para permiso mayor." });
      }
    }

    if (permissionType === "incapacity") {
      if (!permissionData.sickLeaveDateFrom || !permissionData.sickLeaveDateTo) {
        return res.status(400).json({ message: "Fechas requeridas para incapacidad." });
      }
      if (!permissionData.incapacityType || !permissionData.illnessType) {
        return res.status(400).json({ message: "Tipo de incapacidad y enfermedad requeridos." });
      }
      if (!permissionData.sickLeaveDocument) {
        return res.status(400).json({ message: "Documento de incapacidad requerido." });
      }
    }

    const newPermission = new PermissionsModel(permissionData);
    await newPermission.save();

    res.status(201).json({ message: "Permiso creado exitosamente", data: newPermission });
  } catch (error) {
    console.error("Error creando permiso:", error);
    res.status(500).json({ message: "Error interno al crear permiso" });
  }
};

// Obtener permisos propios
permissionsController.getMyPermissions = async (req, res) => {
  try {
    const permissions = await PermissionsModel.find({
      employeeNumber: req.user.numEmpleado,
    }).sort({ createdAt: -1 });

    res.json({ data: permissions });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error al obtener permisos del usuario" });
  }
};

// Obtener permisos del equipo (solo coordinador)
permissionsController.getTeamPermissions = async (req, res) => {
  try {
    const user = req.user;

    if (user.userType !== "Coordinator") {
      return res.status(403).json({ message: "Solo coordinadores pueden ver permisos del equipo" });
    }

    const teamPermissions = await PermissionsModel.find({
      idTeam: user.IdTeam,
      employeeNumber: { $ne: user.numEmpleado },
    }).sort({ createdAt: -1 });

    res.json({ data: teamPermissions });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error al obtener permisos del equipo" });
  }
};

// Obtener todos los permisos (solo admin)
permissionsController.getAllPermissions = async (req, res) => {
  try {
    const user = req.user;

    if (user.userType !== "Admin") {
      return res.status(403).json({ message: "Solo administradores pueden ver todos los permisos" });
    }

    const allPermissions = await PermissionsModel.find().sort({ createdAt: -1 });
    res.json({ data: allPermissions });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error al obtener permisos globales" });
  }
};

// Actualizar estado del permiso
permissionsController.updateStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, supervisorComments } = req.body;
    const user = req.user;

    const permission = await PermissionsModel.findById(id);
    if (!permission) {
      return res.status(404).json({ message: "Permiso no encontrado" });
    }

    if (user.userType === "Coordinator") {
      if (permission.idTeam !== user.IdTeam || permission.employeeNumber === user.numEmpleado) {
        return res.status(403).json({ message: "No autorizado para modificar este permiso" });
      }
    } else if (user.userType !== "Admin") {
      return res.status(403).json({ message: "Acceso denegado" });
    }

    const updated = await PermissionsModel.findByIdAndUpdate(
      id,
      { status, supervisorComments },
      { new: true }
    );

    res.json({ message: "Estado del permiso actualizado", data: updated });
  } catch (error) {
    console.error("Error al actualizar permiso:", error);
    res.status(500).json({ message: "Error al actualizar permiso" });
  }
};

export default permissionsController;
