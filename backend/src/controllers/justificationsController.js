import { v2 as cloudinary } from "cloudinary";
import { config } from "../config.js";
import JustificationLateArrival from "../models/Justifications.js";

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
    const justifications = await JustificationLateArrival.find().sort({ createdAt: -1 });
    res.status(200).json(justifications);
  } catch (error) {
    res.status(500).json({ message: "Error retrieving justifications", error });
  }
};

// 🔹 GET ONE
justificationsController.getJustificationById = async (req, res) => {
  try {
    const justification = await JustificationLateArrival.findById(req.params.id);
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
    } = req.body;

    if (
      !userId?.trim() ||
      !userType?.trim() ||
      !IdTeam?.trim() ||
      !date?.trim() ||
      !arrivalTime?.trim() ||
      !reason?.trim() ||
      !idAccess?.trim()
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

    const newJustification = new JustificationLateArrival({
      userId,
      userType,
      IdTeam,
      date: new Date(date),
      arrivalTime,
      reason,
      evidenceUrl,
      idAccess,
    });

    await newJustification.save();

    res.status(201).json({
      message: "Justification created successfully",
      justification: newJustification,
    });
  } catch (error) {
    console.error("Error backend:", error);
    res.status(500).json({ message: "Error creating justification", error: error.message });
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
    } = req.body;

    const justification = await JustificationLateArrival.findById(req.params.id);
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

    justification.userId = userId;
    justification.userType = userType;
    justification.IdTeam = IdTeam;
    justification.date = new Date(date);
    justification.arrivalTime = arrivalTime;
    justification.reason = reason;
    justification.evidenceUrl = evidenceUrl;
    justification.idAccess = idAccess;

    await justification.save();

    res.status(200).json({
      message: "Justification updated successfully",
      justification,
    });
  } catch (error) {
    console.error("Error backend:", error);
    res.status(500).json({ message: "Error updating justification", error: error.message });
  }
};

// 🔹 DELETE
justificationsController.deleteJustification = async (req, res) => {
  try {
    const justification = await JustificationLateArrival.findByIdAndDelete(req.params.id);
    if (!justification) {
      return res.status(404).json({ message: "Justification not found" });
    }

    res.status(200).json({ message: "Justification deleted", justification });
  } catch (error) {
    console.error("Error backend:", error);
    res.status(500).json({ message: "Error deleting justification", error });
  }
};

export default justificationsController;
