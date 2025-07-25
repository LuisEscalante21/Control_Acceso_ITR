import AccessControlModel from "../models/AccessControl.js";
import { validarHorarioYRegistrar } from "../utils/registroAcceso.js"; 
const accessControlController = {};

// GET all access records
accessControlController.getAllAccessRecords = async (req, res) => {
  try {
    const records = await AccessControlModel.find().populate("id_Employee");
    res.status(200).json(records);
  } catch (error) {
    console.error("Error retrieving access records:", error);
    res.status(500).json({
      message: "Error retrieving access records",
      error: error.message || error.toString(),
    });
  }
};

// GET access record by ID
accessControlController.getAccessRecordById = async (req, res) => {
  try {
    const record = await AccessControlModel.findById(req.params.id).populate("id_Employee");
    if (!record) return res.status(404).json({ message: "Access record not found" });
    res.status(200).json(record);
  } catch (error) {
    console.error("Error retrieving access record by ID:", error);
    res.status(500).json({
      message: "Error retrieving access record",
      error: error.message || error.toString(),
    });
  }
};

// CREATE or UPDATE access record (único por día por tipo)
accessControlController.createOrUpdateAccessRecord = async (req, res) => {
  try {
    const {
      id_Employee,
      entry_time,
      entry_photo,
      exit_time,
      exit_photo,
    } = req.body;

    if (!id_Employee) return res.status(400).json({ message: "Falta id_Employee" });

    let resultadoEntrada = "No enviado";
    let resultadoSalida = "No enviado";

    if (entry_time) {
      resultadoEntrada = await validarHorarioYRegistrar({
        id_Employee,
        tipo: "entrada",
        fechaHora: new Date(entry_time),
        foto: entry_photo,
      });
    }

    if (exit_time) {
      resultadoSalida = await validarHorarioYRegistrar({
        id_Employee,
        tipo: "salida",
        fechaHora: new Date(exit_time),
        foto: exit_photo,
      });
    }

    res.status(201).json({
      message: "Registro de acceso procesado correctamente",
      resultados: {
        entrada: resultadoEntrada,
        salida: resultadoSalida,
      },
    });
  } catch (error) {
    console.error("Error creando o actualizando acceso:", error);
    res.status(500).json({
      message: "Error procesando registro de acceso",
      error: error.message || error.toString(),
    });
  }
};

// DELETE
accessControlController.deleteAccessRecord = async (req, res) => {
  try {
    const deleted = await AccessControlModel.findByIdAndDelete(req.params.id);
    if (!deleted) return res.status(404).json({ message: "Access record not found" });
    res.status(200).json({ message: "Access record deleted successfully" });
  } catch (error) {
    console.error("Error deleting access record:", error);
    res.status(500).json({
      message: "Error deleting access record",
      error: error.message || error.toString(),
    });
  }
};

export default accessControlController;
