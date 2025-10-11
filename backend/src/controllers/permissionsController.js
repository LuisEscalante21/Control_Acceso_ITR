// src/controllers/permissionsController.js
import PermissionsModel from "../models/Permissions.js";
import CoordinatorsModel from "../models/Coordinators.js";
import cloudinary from "../lib/cloudinary.js";
import fs from "fs/promises";
import nodemailer from "nodemailer";

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
const isValidFileType = (t) => allowedTypes.includes(t);

function createTransporter() {
  return nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: process.env.EMAIL_USER,
      pass: (process.env.EMAIL_PASS || "").replace(/\s+/g, ""),
    },
  });
}

const permissionsController = {};

// Crear nuevo permiso
permissionsController.InsertPermission = async (req, res) => {
  try {
    const user = req.user;
    if (!user)
      return res.status(401).json({ message: "No autorizado. Inicia sesión." });

    const { permissionType } = req.body;
    if (!req.body.applicationDay?.trim()) {
      return res
        .status(400)
        .json({ message: "Faltan campos obligatorios (applicationDay)." });
    }

    const files = req.files || (req.file && [req.file]);

    // Metadatos del documento (solo 1 archivo soportado)
    let supportingDocument = "";
    let supportingPublicId = null;
    let supportingResourceType = null;
    let supportingFormat = null;
    let supportingVersion = null;
    let supportingType = null;        // "upload"
    let supportingAccessMode = null;  // "public"

    if (files) {
      for (const file of files) {
        if (!isValidFileType(file.mimetype)) {
          await fs.unlink(file.path).catch(() => {});
          return res.status(400).json({
            message:
              "Tipo de archivo no permitido. Solo PDF, DOC, DOCX, XLS, XLSX, JPG, JPEG, PNG.",
          });
        }

        try {
          const isPdf = file.mimetype === "application/pdf";

          // 🔑 Para PDF fuerza raw; para imágenes/docs deja auto.
          const result = await cloudinary.uploader.upload(file.path, {
            folder: "Permissions",
            resource_type: isPdf ? "raw" : "auto",
            type: "upload",          // público
            access_mode: "public",   // público
            use_filename: true,
            unique_filename: false,
          });

          supportingDocument     = result.secure_url;
          supportingPublicId     = result.public_id;
          supportingResourceType = result.resource_type;
          supportingFormat       = result.format;
          supportingVersion      = result.version;
          supportingType         = result.type;
          supportingAccessMode   = result.access_mode;

          await fs.unlink(file.path).catch(() => {});
        } catch (err) {
          await fs.unlink(file.path).catch(() => {});
          throw err;
        }
      }
    }

    // Datos del permiso
    const permissionData = {
      ...req.body,
      idUser: String(user._id),
      employeeNumber: user.numEmpleado,
      employeeName: (`${user.names ?? ""} ${user.surnames ?? ""}`).trim() || user.fullName,
      idTeam: user.idTeam ?? user.IdTeam,
      createdBy: user._id,
      Discount: req.body.Discount === "true" || req.body.Discount === true,

      supportingDocument,
      supportingPublicId,
      supportingResourceType,
      supportingFormat,
      supportingVersion,
      supportingType,
      supportingAccessMode,
    };

    // Limpieza por tipo
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
      if (!permissionData.permissionDate || !permissionData.startTime || !permissionData.endTime) {
        return res.status(400).json({ message: "Campos requeridos para permiso menor faltantes." });
      }
    } else if (permissionType === "major") {
      if (!permissionData.permissionDateFrom || !permissionData.permissionDateTo) {
        return res.status(400).json({ message: "Fechas requeridas para permiso mayor." });
      }
      if (!permissionData.reason && !permissionData.supportingDocument) {
        return res.status(400).json({ message: "Debe proporcionar una razón o documento para permiso mayor." });
      }
    } else if (permissionType === "incapacity") {
      if (!permissionData.sickLeaveDateFrom || !permissionData.sickLeaveDateTo) {
        return res.status(400).json({ message: "Fechas requeridas para incapacidad." });
      }
      if (!permissionData.incapacityType || !permissionData.illnessType) {
        return res.status(400).json({ message: "Tipo de incapacidad y enfermedad requeridos." });
      }
      if (!permissionData.supportingDocument) {
        return res.status(400).json({ message: "Documento de respaldo requerido para incapacidad." });
      }
    }

    // Guardar permiso en BD
    const newPermission = new PermissionsModel(permissionData);
    await newPermission.save();

    // ==========================================================
    // 🔔 Enviar correo a coordinadores del mismo IdTeam
    // ==========================================================
    try {
      const CoordinatorsModel = (await import("../models/Coordinators.js")).default;

      const coordinators = await CoordinatorsModel.find({
        $or: [
          { IdTeam: user.idTeam ?? user.IdTeam },
          { idTeam: user.idTeam ?? user.IdTeam },
        ],
        status: true,
        email: { $exists: true, $ne: "" },
      }).lean();

      if (coordinators.length > 0) {
        const nodemailer = (await import("nodemailer")).default;

        const transporter = nodemailer.createTransport({
          service: "gmail",
          auth: {
            user: process.env.EMAIL_USER,
            pass: (process.env.EMAIL_PASS || "").replace(/\s+/g, ""),
          },
        });

        await transporter.verify();

        const htmlBody = `
          <div style="font-family:Arial, sans-serif; background:#f6f7fb; padding:20px;">
            <table style="max-width:560px; margin:auto; background:white; border-radius:10px; overflow:hidden;">
              <tr>
                <td style="background:#bf0e28; color:white; padding:14px 20px; font-size:18px; font-weight:bold;">
                  Nuevo permiso pendiente
                </td>
              </tr>
              <tr>
                <td style="padding:20px;">
                  <p>Hola,</p>
                  <p>El empleado <b>${permissionData.employeeName}</b> (N° ${permissionData.employeeNumber}) ha creado un nuevo permiso.</p>
                  <ul style="list-style:none; padding:0;">
                    <li><b>Tipo:</b> ${permissionData.permissionType}</li>
                    <li><b>Fecha de solicitud:</b> ${permissionData.applicationDay}</li>
                  </ul>
                  <p>Por favor revisa el sistema para aprobar o rechazar esta solicitud.</p>
                </td>
              </tr>
            </table>
          </div>`;

        for (const c of coordinators) {
          await transporter.sendMail({
            from: `"Sistema PTC" <${process.env.EMAIL_USER}>`,
            to: c.email,
            subject: "Nuevo permiso de un empleado de tu equipo",
            html: htmlBody,
          });
        }

        console.log(`📧 Notificación enviada a ${coordinators.length} coordinador(es).`);
      } else {
        console.log(" No se encontraron coordinadores con el mismo IdTeam.");
      }
    } catch (mailErr) {
      console.error("Error enviando correo a coordinadores:", mailErr);
    }

    // ==========================================================
    // Respuesta al frontend
    // ==========================================================
    return res.status(201).json({
      message: "Permiso creado exitosamente y notificación enviada.",
      id: newPermission._id,
      data: newPermission,
    });
  } catch (error) {
    console.error("Error backend:", error);
    return res.status(500).json({
      message: "Error creando permiso",
      error: error.message,
    });
  }
};


permissionsController.getDocument = async (req, res) => {
  try {
    const { id } = req.params;
    const perm = await PermissionsModel.findById(id).lean();
    if (!perm) return res.status(404).send("Permiso no encontrado");

    if (
      perm.supportingDocument &&
      /^https?:\/\//i.test(perm.supportingDocument) &&
      (perm.supportingType === "upload" || perm.supportingAccessMode === "public")
    ) {
      return res.redirect(302, perm.supportingDocument);
    }

    const publicId = perm.supportingPublicId;
    if (!publicId) return res.status(404).send("No hay documento");

    const resourceType = perm.supportingResourceType || "raw";
    const type = perm.supportingType || "upload";
    const format = perm.supportingFormat || "pdf";
    const sign = type === "authenticated";

    const viewUrl = cloudinary.url(publicId, {
      secure: true,
      resource_type: resourceType,
      type,
      format,
      sign_url: sign,
    });

    return res.redirect(302, viewUrl);
  } catch (error) {
    console.error("Error obteniendo documento:", error);
    return res.status(500).send("Error obteniendo documento");
  }
};

permissionsController.getMyPermissions = async (req, res) => {
  try {
    const userId = String(req.user._id);
    const permissions = await PermissionsModel.find({ idUser: userId }).sort({
      createdAt: -1,
    });
    res.json({ data: permissions });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error al obtener permisos del usuario" });
  }
};

permissionsController.getTeamPermissions = async (req, res) => {
  try {
    const user = req.user;
    if (user.userType !== "Coordinator") {
      return res
        .status(403)
        .json({ message: "Solo coordinadores pueden gestionar permisos." });
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

permissionsController.getAllPermissions = async (req, res) => {
  try {
    const user = req.user;
    if (user.userType !== "Admin") {
      return res.status(403).json({
        message: "Solo administradores pueden gestionar permisos.",
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

permissionsController.getOne = async (req, res) => {
  try {
    const { id } = req.params;
    const perm = await PermissionsModel.findById(id);
    if (!perm)
      return res.status(404).json({ message: "Permiso no encontrado" });

    // 📤 Al tener actionBy como array en el schema, aquí ya regresa con todo el historial
    res.json({ data: perm });
  } catch (error) {
    console.error("Error al obtener permiso:", error);
    res.status(500).json({ message: "Error al obtener permiso" });
  }
};

permissionsController.updateStatus = async (req, res) => {
  try {
    const { id } = req.params;
    let { status, supervisorComments, Discount } = req.body;
    const user = req.user;

    // 🔐 Validación de permisos
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

    const permission = await PermissionsModel.findById(id);
    if (!permission)
      return res.status(404).json({ message: "Permiso no encontrado" });

    if (permission.status !== "pending") {
      return res
        .status(400)
        .json({ message: "Este permiso ya fue gestionado" });
    }

    // 🧑 Validación de rol
    if (user.userType === "Coordinator") {
      const sameTeam =
        permission.idTeam?.toString() ===
        (user.idTeam ?? user.IdTeam)?.toString();
      const isOwn = String(permission.idUser) === String(user._id);
      if (!sameTeam || isOwn) {
        return res.status(403).json({
          message:
            "Solo administradores registrados pueden gestionar permisos.",
        });
      }
    } else if (user.userType !== "Admin") {
      return res.status(403).json({
        message: "Solo administradores registrados pueden gestionar permisos.",
      });
    }

    // 🕒 Datos para historial de acción
    const now = new Date();
    const actionData = {
      user: user.fullName,
      day: now.getDate(),
      month: now.getMonth() + 1,
      year: now.getFullYear(),
      hour: now.getHours(),
      min: now.getMinutes(),
    };

    // 📝 Actualizamos el permiso: estado, comentarios y registramos acción en historial
    const updated = await PermissionsModel.findByIdAndUpdate(
      id,
      {
        $set: {
          status: statusNorm,
          supervisorComments,
          Discount,
        },
        $push: { actionBy: actionData },
      },
      { new: true }
    );

    return res.json({
      message: "Estado del permiso actualizado ✅",
      data: updated,
    });
  } catch (error) {
    console.error("Error al actualizar permiso:", error);
    return res.status(500).json({ message: "Error al actualizar permiso" });
  }
};

permissionsController.deleteOne = async (req, res) => {
  try {
    const { id } = req.params;
    const user = req.user;

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

export default permissionsController;
