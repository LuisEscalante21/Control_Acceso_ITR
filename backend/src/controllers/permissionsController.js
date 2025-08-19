// src/controllers/permissionsController.js
import PermissionsModel from "../models/Permissions.js";
import cloudinary from "../lib/cloudinary.js";
import fs from "fs/promises";

const permissionsController = {};

// Tipos de archivo permitidos
const isValidFileType = (mimetype) => {
  const allowedTypes = [
    "application/pdf",
    "application/msword",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    "application/vnd.ms-excel",
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    "image/jpeg",
    "image/png",
    "image/jpg",
  ];
  return allowedTypes.includes(mimetype);
};

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

    let documentUrls = "";
    let supportingPublicId = null;
    let supportingResourceType = null;

    if (files) {
      for (const file of files) {
        if (!isValidFileType(file.mimetype)) {
          await fs.unlink(file.path).catch(() => {});
          return res.status(400).json({
            message:
              "Tipo de archivo no permitido. Solo se permiten PDF, DOC, DOCX, XLS, XLSX, JPG, JPEG, PNG",
          });
        }

        try {
          const result = await cloudinary.uploader.upload(file.path, {
            folder: "Permissions",
            resource_type: "auto",
            use_filename: true,
            unique_filename: false,
            format: file.originalname.split(".").pop(),
          });

          documentUrls = result.secure_url;
          supportingPublicId = result.public_id;
          supportingResourceType = result.resource_type;

          await fs.unlink(file.path).catch(() => {});
        } catch (uploadError) {
          await fs.unlink(file.path).catch(() => {});
          throw uploadError;
        }
      }
    }

    const permissionData = {
      ...req.body,
      idUser: String(user._id),
      employeeNumber: user.numEmpleado,
      employeeName:
        `${user.names ?? ""} ${user.surnames ?? ""}`.trim() || user.fullName,
      department: req.body.department || user.department,
      idTeam: user.idTeam ?? user.IdTeam,
      createdBy: user._id,
      Discount: req.body.Discount === "true" || req.body.Discount === true,
      quantityDiscount: Number(req.body.quantityDiscount || 0),
      supportingDocument: documentUrls,
      supportingPublicId,
      supportingResourceType,
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

    return res.status(201).json({
      message: "Permiso creado exitosamente",
      id: newPermission._id,
      data: newPermission,
    });
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

// ===================== Mis permisos (filtra por idUser) =====================
permissionsController.getMyPermissions = async (req, res) => {
  try {
    const userId = String(req.user._id);

    const permissions = await PermissionsModel.find({
      idUser: userId,
    }).sort({ createdAt: -1 });

    res.json({ data: permissions });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error al obtener permisos del usuario" });
  }
};

// ===================== Permisos del equipo (coord) =====================
permissionsController.getTeamPermissions = async (req, res) => {
  try {
    const user = req.user;
    if (user.userType !== "Coordinator") {
      return res
        .status(403)
        .json({ message: "Solo administradores registrados pueden gestionar permisos." });
    }

    const teamPermissions = await PermissionsModel.find({
      idTeam: user.idTeam ?? user.IdTeam,
      idUser: { $ne: String(user._id) },
    }).sort({ createdAt: -1 });

    res.json({ data: teamPermissions });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error al obtener permisos del equipo" });
  }
};

// ===================== Todos los permisos (Admin) =====================
permissionsController.getAllPermissions = async (req, res) => {
  try {
    const user = req.user;
    if (user.userType !== "Admin") {
      return res.status(403).json({
        message: "Solo administradores registrados pueden gestionar permisos.",
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

// ===================== Obtener UNO (detalle) =====================
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
    let { status, supervisorComments, Discount, quantityDiscount } = req.body;
    const user = req.user;

    // Admin read-only no puede gestionar
    if (user.userType === "Admin" && user.isReadOnly) {
      return res.status(403).json({
        message: "Solo administradores registrados pueden gestionar permisos.",
      });
    }

    const statusNorm = String(status || "").toLowerCase();
    if (!["approved", "rejected", "pending", "urgent"].includes(statusNorm)) {
      return res.status(400).json({ message: "Estado inválido." });
    }

    if (typeof Discount === "string") Discount = Discount === "true";
    else Discount = !!Discount;

    quantityDiscount = Number(quantityDiscount || 0);
    if (Number.isNaN(quantityDiscount) || quantityDiscount < 0) {
      return res.status(400).json({ message: "Cantidad de descuento inválida." });
    }

    const permission = await PermissionsModel.findById(id);
    if (!permission)
      return res.status(404).json({ message: "Permiso no encontrado" });

    if (permission.status !== "pending") {
      return res
        .status(400)
        .json({ message: "Este permiso ya fue gestionado" });
    }

    if (user.userType === "Coordinator") {
      const sameTeam =
        permission.idTeam?.toString() ===
        (user.idTeam ?? user.IdTeam)?.toString();
      const isOwn = String(permission.idUser) === String(user._id);
      if (!sameTeam || isOwn) {
        return res
          .status(403)
          .json({ message: "Solo administradores registrados pueden gestionar permisos." });
      }
    } else if (user.userType !== "Admin") {
      return res
        .status(403)
        .json({ message: "Solo administradores registrados pueden gestionar permisos." });
    }

    if (!Discount) quantityDiscount = 0;

    const updated = await PermissionsModel.findByIdAndUpdate(
      id,
      {
        status: statusNorm,
        supervisorComments,
        actionBy: user.fullName,
        Discount,
        quantityDiscount,
      },
      { new: true }
    );

    return res.json({
      message: "Estado del permiso actualizado",
      data: updated,
    });
  } catch (error) {
    console.error("Error al actualizar permiso:", error);
    return res.status(500).json({ message: "Error al actualizar permiso" });
  }
};

// ===================== Borrar UNO =====================
permissionsController.deleteOne = async (req, res) => {
  try {
    const { id } = req.params;
    const user = req.user;

    // Admin read-only no puede eliminar
    if (user.userType === "Admin" && user.isReadOnly) {
      return res.status(403).json({
        message: "Solo administradores registrados pueden gestionar permisos.",
      });
    }

    const perm = await PermissionsModel.findById(id);
    if (!perm)
      return res.status(404).json({ message: "Permiso no encontrado" });

    if (perm.status !== "pending") {
      return res
        .status(400)
        .json({ message: "Solo puedes eliminar permisos pendientes" });
    }

    // Borrar archivo en Cloudinary si existe
    try {
      if (perm.supportingPublicId) {
        await cloudinary.uploader.destroy(perm.supportingPublicId, {
          resource_type: perm.supportingResourceType || "raw",
          invalidate: true,
        });
      }
    } catch (e) {
      console.warn("No se pudo borrar en Cloudinary:", e?.message || e);
    }

    if (user.userType === "Employee") {
      if (String(perm.idUser) !== String(user._id)) {
        return res
          .status(403)
          .json({ message: "No autorizado para borrar este permiso" });
      }
    } else if (user.userType === "Coordinator") {
      if (
        perm.idTeam?.toString() !== (user.idTeam ?? user.IdTeam)?.toString() ||
        String(perm.idUser) === String(user._id)
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

// ===================== Borrar TODOS (Admin) + limpia Cloudinary =====================
permissionsController.clearAllPermissions = async (req, res) => {
  try {
    const user = req.user;
    const { confirm } = req.query;

    if (user.userType !== "Admin") {
      return res.status(403).json({
        message: "Solo administradores registrados pueden gestionar permisos.",
      });
    }

    if (user.isReadOnly) {
      return res.status(403).json({
        message: "Solo administradores registrados pueden gestionar permisos.",
      });
    }

    if (confirm !== "REMOVE") {
      return res.status(400).json({
        message:
          "Confirmación inválida. Debe proporcionar ?confirm=REMOVE",
      });
    }

    // 1) Traer todos los permisos
    const all = await PermissionsModel.find();

    // 2) Borrar archivos en Cloudinary
    for (const perm of all) {
      try {
        if (perm.supportingPublicId) {
          await cloudinary.uploader.destroy(perm.supportingPublicId, {
            resource_type: perm.supportingResourceType || "raw",
            invalidate: true,
          });
        }
      } catch (e) {
        console.warn("No se pudo borrar en Cloudinary:", e?.message || e);
      }
    }

    // 3) Borrar todos en Mongo
    await PermissionsModel.deleteMany({});

    res.json({
      message:
        "REMOVE: Todos los permisos y documentos asociados han sido eliminados correctamente.",
    });
  } catch (error) {
    console.error("Error al eliminar permisos:", error);
    res
      .status(500)
      .json({ message: "Error del servidor al eliminar todos los permisos." });
  }
};

export default permissionsController;
