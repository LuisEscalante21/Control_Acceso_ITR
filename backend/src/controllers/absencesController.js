import Absence from "../models/Absences.js";

const absencesController = {};

// --------------------------------------------------------------------------
// 🔹 GET ALL (Obtener todas las inasistencias con filtros)
// --------------------------------------------------------------------------
absencesController.getAbsences = async (req, res) => {
  try {
    const { idTeam, onlyEmployeeId } = req.query;
    
    // Construir filtro dinámico
    const filter = {};
    
    if (idTeam && idTeam !== 'Todas') {
      filter.idTeam = idTeam;
    }
    
    if (onlyEmployeeId) {
      filter.id_Employee = onlyEmployeeId;
    }
    
    const absences = await Absence.find(filter)
      .sort({ date: -1, createdAt: -1 })
      .populate('idTeam', 'name'); // Populate para obtener el nombre del equipo
    
    res.status(200).json(absences);
  } catch (error) {
    console.error("Error retrieving absences:", error);
    res.status(500).json({ message: "Error retrieving absences", error: error.message });
  }
};

// --------------------------------------------------------------------------
// 🔹 GET ONE (Obtener una inasistencia por ID)
// --------------------------------------------------------------------------
absencesController.getAbsenceById = async (req, res) => {
  try {
    const absence = await Absence.findById(req.params.id).populate('idTeam', 'name');
    if (!absence) {
      return res.status(404).json({ message: "Absence record not found" });
    }
    res.status(200).json(absence);
  } catch (error) {
    console.error("Error retrieving absence by ID:", error);
    res.status(500).json({ message: "Error retrieving absence", error: error.message });
  }
};

// --------------------------------------------------------------------------
// 🔹 CREATE / UPSERT (Crear o Actualizar una inasistencia)
// 🚨 Nota: Este es el método usado por el script de fondo (`absence_checker.js`)
// --------------------------------------------------------------------------
absencesController.createOrUpdateAbsence = async (req, res) => {
  try {
    const {
      id_Employee,
      date,
      reason,
      names,
      surnames,
      employee_type,
      idTeam,
    } = req.body;

    if (!id_Employee?.trim() || !date?.trim() || !reason?.trim()) {
      return res.status(400).json({ message: "Missing required fields: id_Employee, date, or reason" });
    }
    
    const filter = { id_Employee, date };

    const updateData = {
      id_Employee,
      date,
      reason,
      names,
      surnames,
      employee_type,
      idTeam,
      registered_at: new Date(),
    };

    const absence = await Absence.findOneAndUpdate(
      filter, 
      { $set: updateData }, 
      { new: true, upsert: true, setDefaultsOnInsert: true }
    ).populate('idTeam', 'name');

    res.status(201).json({
      message: absence.__v === 0 ? "Absence record created successfully" : "Absence record updated successfully",
      absence,
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(409).json({ 
        message: "Absence record already exists for this employee and date", 
        error: error.message
      });
    }
    console.error("Error creating/updating absence:", error);
    res.status(500).json({ message: "Error creating/updating absence", error: error.message });
  }
};

// --------------------------------------------------------------------------
// 🔹 UPDATE (Actualizar campos específicos por ID)
// --------------------------------------------------------------------------
absencesController.updateAbsence = async (req, res) => {
  try {
    const updateFields = {
      reason: req.body.reason,
      names: req.body.names,
      surnames: req.body.surnames,
      employee_type: req.body.employee_type,
      date: req.body.date,
      idTeam: req.body.idTeam,
    };
    
    Object.keys(updateFields).forEach(key => updateFields[key] === undefined && delete updateFields[key]);

    const absence = await Absence.findByIdAndUpdate(
      req.params.id, 
      { $set: updateFields },
      { new: true, runValidators: true }
    ).populate('idTeam', 'name');

    if (!absence) {
      return res.status(404).json({ message: "Absence record not found" });
    }

    res.status(200).json({
      message: "Absence record updated successfully",
      absence,
    });
  } catch (error) {
    console.error("Error updating absence:", error);
    res.status(500).json({ message: "Error updating absence", error: error.message });
  }
};

// --------------------------------------------------------------------------
// 🔹 DELETE (Eliminar una inasistencia por ID)
// --------------------------------------------------------------------------
absencesController.deleteAbsence = async (req, res) => {
  try {
    const absence = await Absence.findByIdAndDelete(req.params.id);
    if (!absence) {
      return res.status(404).json({ message: "Absence record not found" });
    }

    res.status(200).json({ message: "Absence record deleted", absence });
  } catch (error) {
    console.error("Error deleting absence:", error);
    res.status(500).json({ message: "Error deleting absence", error: error.message });
  }
};

export default absencesController;