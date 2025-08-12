// src/controllers/permissionsController.js
import PermissionsModel from "../models/Permissions.js";
import cloudinary from "../lib/cloudinary.js";

const permissionsController = {};



import fs from "fs/promises";

// Función para validar tipos de archivo permitidos
const isValidFileType = (mimetype) => {
  const allowedTypes = [
    "application/pdf",
    "application/msword",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    "application/vnd.ms-excel",
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  ];
  return allowedTypes.includes(mimetype);
};

// ===================== Crear un nuevo permiso =====================
// src/controllers/permissionsController.js







// ===================== Crear un nuevo permiso =====================
permissionsController.InsertPermission = async (req, res) => {
  try {
    const user = req.user;
    if (!user)
      return res.status(401).json({ message: "No autorizado. Inicia sesión." });

    const { permissionType } = req.body;

    if (!req.body.applicationDay?.trim() || !req.body.department?.trim()) {
      return res.status(400).json({ message: "Faltan campos obligatorios" });
    }

    const files = req.files || (req.file && [req.file]);

    // Declarar fuera para que estén disponibles después del bucle
    let documentUrls = "";
    let cloudinaryIds = [];

    // Subir pdf(s)
    if (files) {
      for (const file of files) {
        // Validar tipo de archivo
        if (!isValidFileType(file.mimetype)) {
          await fs.unlink(file.path).catch(console.error);
          return res.status(400).json({
            message:
              "Tipo de archivo no permitido. Solo se permiten PDF, DOC, DOCX, XLS, XLSX, JPG, JPEG, PNG",
          });
        }

        try {
          // Para archivos, usar resource_type "auto"
          const result = await cloudinary.uploader.upload(file.path, {
            folder: "documents",
            resource_type: "auto",
            use_filename: true,
            unique_filename: false,
            format: file.originalname.split(".").pop(),
          });

          documentUrls = result.secure_url;
          cloudinaryIds.push(result.public_id);

          console.log("Archivo subido exitosamente:");
          console.log("- URL:", result.secure_url);
          console.log("- Public ID:", result.public_id);
          console.log("- Resource Type:", result.resource_type);
          console.log("- Format:", result.format);

          // Eliminar archivo temporal
          await fs.unlink(file.path).catch(console.error);
        } catch (uploadError) {
          await fs.unlink(file.path).catch(console.error);
          throw uploadError;
        }
      }
    }

    const permissionData = {
      ...req.body,
      employeeNumber: user.numEmpleado,
      employeeName:
        `${user.names ?? ""} ${user.surnames ?? ""}`.trim() || user.fullName,
      department: req.body.department || user.department,
      idTeam: user.idTeam ?? user.IdTeam,
      createdBy: user._id,
      Discount: req.body.Discount === "true" || req.body.Discount === true,
      quantityDiscount: Number(req.body.quantityDiscount || 0),
      supportingDocument: documentUrls, // ahora sí tiene valor
    };

    // Limpiezas por tipo
    if (permissionType !== "minor") {
      delete permissionData.permissionDate;
      delete permissionData.startTime;
      delete permissionData.endTime;
    }
    if (permissionType !== "major") {
      delete permissionData.permissionDateFrom;
      delete permissionData.permissionDateTo;
    }
    if (permissionType !== "incapacity") {
      delete permissionData.sickLeaveDateFrom;
      delete permissionData.sickLeaveDateTo;
      delete permissionData.incapacityType;
      delete permissionData.illnessType;
    }

    // Validaciones por tipo
    if (permissionType === "minor") {
      if (
        !permissionData.permissionDate ||
        !permissionData.startTime ||
        !permissionData.endTime
      ) {
        return res
          .status(400)
          .json({ message: "Campos requeridos para permiso menor faltantes." });
      }
    }
    if (permissionType === "major") {
      if (
        !permissionData.permissionDateFrom ||
        !permissionData.permissionDateTo
      ) {
        return res
          .status(400)
          .json({ message: "Fechas requeridas para permiso mayor." });
      }
      if (!permissionData.reason && !permissionData.supportingDocument.length) {
        return res.status(400).json({
          message:
            "Debe proporcionar una razón o documento para permiso mayor.",
        });
      }
    }
    if (permissionType === "incapacity") {
      if (
        !permissionData.sickLeaveDateFrom ||
        !permissionData.sickLeaveDateTo
      ) {
        return res
          .status(400)
          .json({ message: "Fechas requeridas para incapacidad." });
      }
      if (!permissionData.incapacityType || !permissionData.illnessType) {
        return res
          .status(400)
          .json({ message: "Tipo de incapacidad y enfermedad requeridos." });
      }
      if (!permissionData.supportingDocument.length) {
        return res.status(400).json({
          message: "Documento de respaldo requerido para incapacidad.",
        });
      }
    }

    const newPermission = new PermissionsModel(permissionData);
    await newPermission.save();

    return res
      .status(201)
      .json({ message: "Permiso creado exitosamente", data: newPermission });
  } catch (error) {
    console.error("Error backend:", error);
    return res
      .status(500)
      .json({ message: "Error creando permiso", error: error.message });
  }
};




// ===================== Ver documento asociado =====================
permissionsController.getDocument = async (req, res) => {
  try {
    const { id } = req.params;
    const perm = await PermissionsModel.findById(id).lean();
    if (!perm) return res.status(404).send("Permiso no encontrado");
    if (!perm.supportingDocument)
      return res.status(404).send("No hay documento");

    let viewUrl = perm.supportingDocument;

    // Si es PDF pero no tiene extensión, agregarla
    if (
      (perm.supportingResourceType === "raw" ||
        /\/raw\/upload\//.test(viewUrl)) &&
      !/\.(pdf)(\?|$)/i.test(viewUrl)
    ) {
      viewUrl += ".pdf";
    }

    return res.redirect(302, viewUrl);
  } catch (error) {
    console.error("Error obteniendo documento:", error);
    return res.status(500).send("Error obteniendo documento");
  }
};

// ===================== Mis permisos =====================
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

// ===================== Permisos del equipo (solo coordinador) =====================
permissionsController.getTeamPermissions = async (req, res) => {
  try {
    const user = req.user;
    if (user.userType !== "Coordinator") {
      return res
        .status(403)
        .json({ message: "Solo coordinadores pueden ver permisos del equipo" });
    }

    const teamPermissions = await PermissionsModel.find({
      idTeam: user.idTeam ?? user.IdTeam,
      employeeNumber: { $ne: user.numEmpleado },
    }).sort({ createdAt: -1 });

    res.json({ data: teamPermissions });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error al obtener permisos del equipo" });
  }
};

// ===================== Todos los permisos (solo Admin) =====================
permissionsController.getAllPermissions = async (req, res) => {
  try {
    const user = req.user;
    if (user.userType !== "Admin") {
      return res.status(403).json({
        message: "Solo administradores pueden ver todos los permisos",
      });
    }

    const allPermissions = await PermissionsModel.find().sort({
      createdAt: -1,
    });
    res.json({ data: allPermissions });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error al obtener permisos globales" });
  }
};

// ===================== Obtener UNO (ver detalle) =====================
permissionsController.getOne = async (req, res) => {
  try {
    const { id } = req.params;
    const perm = await PermissionsModel.findById(id);
    if (!perm)
      return res.status(404).json({ message: "Permiso no encontrado" });
    res.json({ data: perm });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error al obtener permiso" });
  }
};

// ===================== Actualizar estado (coord/admin) =====================
permissionsController.updateStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, supervisorComments } = req.body;
    const user = req.user;

    const permission = await PermissionsModel.findById(id);
    if (!permission)
      return res.status(404).json({ message: "Permiso no encontrado" });

    if (permission.status !== "pending") {
      return res
        .status(400)
        .json({ message: "Este permiso ya fue gestionado" });
    }

    if (user.userType === "Coordinator") {
      if (
        permission.idTeam?.toString() !==
          (user.idTeam ?? user.IdTeam)?.toString() ||
        permission.employeeNumber === user.numEmpleado
      ) {
        return res
          .status(403)
          .json({ message: "No autorizado para modificar este permiso" });
      }
    } else if (user.userType !== "Admin") {
      return res.status(403).json({ message: "Acceso denegado" });
    }

    const updated = await PermissionsModel.findByIdAndUpdate(
      id,
      { status, supervisorComments, actionBy: user.fullName },
      { new: true }
    );

    res.json({ message: "Estado del permiso actualizado", data: updated });
  } catch (error) {
    console.error("Error al actualizar permiso:", error);
    res.status(500).json({ message: "Error al actualizar permiso" });
  }
};

// ===================== Borrar UNO =====================
permissionsController.deleteOne = async (req, res) => {
  try {
    const { id } = req.params;
    const user = req.user;

    const perm = await PermissionsModel.findById(id);
    if (!perm)
      return res.status(404).json({ message: "Permiso no encontrado" });

    if (perm.status !== "pending") {
      return res
        .status(400)
        .json({ message: "Solo puedes eliminar permisos pendientes" });
    }

    if (user.userType === "Employee") {
      if (perm.employeeNumber !== user.numEmpleado) {
        return res
          .status(403)
          .json({ message: "No autorizado para borrar este permiso" });
      }
    } else if (user.userType === "Coordinator") {
      if (
        perm.idTeam?.toString() !== (user.idTeam ?? user.IdTeam)?.toString() ||
        perm.employeeNumber === user.numEmpleado
      ) {
        return res
          .status(403)
          .json({ message: "No autorizado para borrar este permiso" });
      }
    } else if (user.userType !== "Admin") {
      return res.status(403).json({ message: "Rol no autorizado" });
    }

    await PermissionsModel.findByIdAndDelete(id);
    res.json({ message: "Permiso eliminado" });
  } catch (error) {
    console.error("Error eliminando permiso:", error);
    res.status(500).json({ message: "Error interno al eliminar permiso" });
  }
};

// ===================== Borrar TODOS (solo Admin) =====================
permissionsController.clearAllPermissions = async (req, res) => {
  try {
    const user = req.user;
    const { confirm } = req.query;

    if (user.userType !== "Admin") {
      return res.status(403).json({
        message:
          "No autorizado. Solo administradores pueden realizar esta acción.",
      });
    }

    if (confirm !== "REMOVE") {
      return res.status(400).json({
        message:
          "Confirmación inválida. Debe proporcionar ?confirm=REMOVE para ejecutar esta acción.",
      });
    }

    await PermissionsModel.deleteMany({});
    res.json({
      message: "REMOVE: Todos los permisos han sido eliminados correctamente.",
    });
  } catch (error) {
    console.error("Error al eliminar permisos:", error);
    res
      .status(500)
      .json({ message: "Error del servidor al eliminar todos los permisos." });
  }
};

export default permissionsController;
