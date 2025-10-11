import { v2 as cloudinary } from "cloudinary";
import { config } from "../config.js";
import JustificationLateArrival from "../models/Justifications.js";
import Absence from "../models/Absences.js";

// Configuración de Cloudinary
cloudinary.config({
  cloud_name: config.cloudinary.cloudinary_name,
  api_key: config.cloudinary.cloudinary_api_key,
  api_secret: config.cloudinary.cloudinary_api_secret,
});

const justificationsController = {};

// 🔹 GET ALL
justificationsController.getJustifications = async (req, res) => {
  try {
    const justifications = await JustificationLateArrival.find().sort({
      createdAt: -1,
    });
    res.status(200).json(justifications);
  } catch (error) {
    res.status(500).json({ message: "Error retrieving justifications", error });
  }
};

// 🔹 GET ONE
justificationsController.getJustificationById = async (req, res) => {
  try {
    const justification = await JustificationLateArrival.findById(
      req.params.id
    );
    if (!justification) {
      return res.status(404).json({ message: "Justification not found" });
    }
    res.status(200).json(justification);
  } catch (error) {
    res.status(500).json({ message: "Error retrieving justification", error });
  }
};

// 🔹 CREATE
justificationsController.createJustification = async (req, res) => {
  try {
    const {
      userId,
      userType,
      IdTeam,
      date,
      arrivalTime,
      reason,
      idAccess,
      idAbsence, // 🔹 NUEVO: Para justificar inasistencias
    } = req.body;

    // 🔹 Validación: debe venir al menos uno de los dos
    if (!idAccess && !idAbsence) {
      return res.status(400).json({
        message:
          "Se requiere idAccess (para llegadas tarde) o idAbsence (para inasistencias)",
      });
    }

    // Validaciones de campos obligatorios
    if (
      !userId?.trim() ||
      !userType?.trim() ||
      !IdTeam?.trim() ||
      !date?.trim() ||
      !arrivalTime?.trim() ||
      !reason?.trim()
    ) {
      return res.status(400).json({ message: "Missing required fields" });
    }

    const validUserTypes = ["Employee", "Coordinator", "Administrator"];
    if (!validUserTypes.includes(userType)) {
      return res.status(400).json({ message: "Invalid user type" });
    }

    // Subir archivo si se incluyó
    let evidenceUrl = "";
    if (req.file) {
      const result = await cloudinary.uploader.upload(req.file.path, {
        folder: "justifications",
        resource_type: "auto",
      });
      evidenceUrl = result.secure_url;
    }

    // Crear la justificación
    const newJustification = new JustificationLateArrival({
      userId,
      userType,
      IdTeam,
      date: new Date(date),
      arrivalTime,
      reason,
      evidenceUrl,
      idAccess: idAccess || null, // Puede ser null si es inasistencia
      idAbsence: idAbsence || null, // 🔹 NUEVO: Puede ser null si es acceso
    });

    await newJustification.save();

    // 🔹 Si es una inasistencia, actualizar su estado a "justificada"
    if (idAbsence) {
      await Absence.findByIdAndUpdate(
        idAbsence,
        { status: "justificada" },
        { new: true }
      );
    }

    res.status(201).json({
      message: "Justification created successfully",
      justification: newJustification,
    });
  } catch (error) {
    console.error("Error backend:", error);
    res.status(500).json({
      message: "Error creating justification",
      error: error.message,
    });
  }
};

// 🔹 UPDATE
justificationsController.updateJustification = async (req, res) => {
  try {
    const {
      userId,
      userType,
      IdTeam,
      date,
      arrivalTime,
      reason,
      idAccess,
      idAbsence, // 🔹 NUEVO
    } = req.body;

    const justification = await JustificationLateArrival.findById(
      req.params.id
    );
    if (!justification) {
      return res.status(404).json({ message: "Justification not found" });
    }

    let evidenceUrl = justification.evidenceUrl;

    // Subir nuevo archivo si se envió
    if (req.file) {
      const result = await cloudinary.uploader.upload(req.file.path, {
        folder: "justifications",
        resource_type: "auto",
      });
      evidenceUrl = result.secure_url;
    }

    // Actualizar campos
    justification.userId = userId;
    justification.userType = userType;
    justification.IdTeam = IdTeam;
    justification.date = new Date(date);
    justification.arrivalTime = arrivalTime;
    justification.reason = reason;
    justification.evidenceUrl = evidenceUrl;
    justification.idAccess = idAccess || null; // 🔹 Actualizado
    justification.idAbsence = idAbsence || null; // 🔹 NUEVO

    await justification.save();

    // 🔹 Si se actualizó una justificación de inasistencia, actualizar estado
    if (idAbsence) {
      await Absence.findByIdAndUpdate(
        idAbsence,
        { status: "justificada" },
        { new: true }
      );
    }

    res.status(200).json({
      message: "Justification updated successfully",
      justification,
    });
  } catch (error) {
    console.error("Error backend:", error);
    res.status(500).json({
      message: "Error updating justification",
      error: error.message,
    });
  }
};

// 🔹 DELETE
justificationsController.deleteJustification = async (req, res) => {
  try {
    const justification = await JustificationLateArrival.findByIdAndDelete(
      req.params.id
    );
    if (!justification) {
      return res.status(404).json({ message: "Justification not found" });
    }

    // 🔹 Si se elimina una justificación de inasistencia, volver estado a "pendiente"
    if (justification.idAbsence) {
      await Absence.findByIdAndUpdate(
        justification.idAbsence,
        { status: "pendiente" },
        { new: true }
      );
    }

    res.status(200).json({ message: "Justification deleted", justification });
  } catch (error) {
    console.error("Error backend:", error);
    res.status(500).json({ message: "Error deleting justification", error });
  }
};

// 🔹 DELETE ALL JUSTIFICATIONS
justificationsController.deleteAllJustifications = async (req, res) => {
  try {
    // 🔹 Antes de eliminar todas, resetear estados de inasistencias
    const justifications = await JustificationLateArrival.find({});

    for (const just of justifications) {
      if (just.idAbsence) {
        await Absence.findByIdAndUpdate(
          just.idAbsence,
          { status: "pendiente" },
          { new: true }
        );
      }
    }

    const result = await JustificationLateArrival.deleteMany({});
    res.status(200).json({
      message: "Todas las justificaciones han sido eliminadas",
      deleted_count: result.deletedCount,
    });
  } catch (error) {
    console.error("Error deleting all justifications:", error);
    res
      .status(500)
      .json({ message: "Error eliminando justificaciones", error });
  }
};

export default justificationsController;
