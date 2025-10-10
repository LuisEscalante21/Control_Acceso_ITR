import Absence from "../models/Absences.js";

const absencesController = {};

// --------------------------------------------------------------------------
// 🔹 GET ALL (Obtener todas las inasistencias con filtros dinámicos)
// --------------------------------------------------------------------------
absencesController.getAbsences = async (req, res) => {
  try {
    const { idTeam, onlyEmployeeId, year, month, week, day } = req.query;
    const filter = {};

    // 🔹 Filtro por área
    if (idTeam && idTeam !== "Todas") {
      filter.idTeam = idTeam;
    }

    // 🔹 Filtro por empleado
    if (onlyEmployeeId) {
      filter.id_Employee = onlyEmployeeId;
    }

    // ----------------------------------------------------------------------
    // 🔹 Filtros dinámicos por fecha
    // ----------------------------------------------------------------------
    if (year) {
      // Año exacto (ejemplo: 2025)
      filter.date = { $regex: new RegExp(`^${year}`, "i") };
    }

    if (month) {
      // Mes en formato "YYYY-MM"
      const [y, m] = month.split("-");
      filter.date = { $regex: new RegExp(`^${y}-${m}`, "i") };
    }

    if (week) {
      // Formato ISO 8601: "2025-W41"
      const [yearPart, weekPart] = week.split("-W");
      const y = parseInt(yearPart, 10);
      const w = parseInt(weekPart, 10);

      // Calcular el rango de fechas de la semana ISO correctamente
      const simpleISOWeekToRange = (year, week) => {
        const jan4 = new Date(year, 0, 4);
        const jan4Day = jan4.getDay() || 7;
        const firstMonday = new Date(jan4);
        firstMonday.setDate(jan4.getDate() - jan4Day + 1);
        const start = new Date(firstMonday);
        start.setDate(start.getDate() + (week - 1) * 7);
        const end = new Date(start);
        end.setDate(start.getDate() + 6);
        return { start, end };
      };

      const { start, end } = simpleISOWeekToRange(y, w);

      // Convertimos a formato compatible con tu BD (dd/mm/yyyy)
      const formatDate = (date) => {
        const d = String(date.getDate()).padStart(2, "0");
        const m = String(date.getMonth() + 1).padStart(2, "0");
        const yy = date.getFullYear();
        return `${d}/${m}/${yy}`;
      };

      const startStr = formatDate(start);
      const endStr = formatDate(end);

      // Traer todas las fechas entre ese rango
      filter.date = {
        $gte: startStr,
        $lte: endStr,
      };
    }

    if (day) {
      // Día exacto en formato "YYYY-MM-DD"
      let normalizedDate = day;
      if (day.includes("-")) {
        const [y, m, d] = day.split("-");
        normalizedDate = `${d}/${m}/${y}`;
      }
      filter.date = normalizedDate;
    }

    // ----------------------------------------------------------------------
    // 🔹 Consulta
    // ----------------------------------------------------------------------
    const absences = await Absence.find(filter)
      .sort({ date: -1, createdAt: -1 })
      .populate("idTeam", "name")
      .populate("id_Employee", "names surnames photo collectionName");

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
    const absence = await Absence.findById(req.params.id)
      .populate("idTeam", "name")
      .populate("id_Employee", "names surnames photo collectionName");

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
      status,
    } = req.body;

    if (!id_Employee?.trim() || !date?.trim() || !reason?.trim()) {
      return res.status(400).json({
        message: "Missing required fields: id_Employee, date, or reason",
      });
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
      status: status || "pendiente",
      registered_at: new Date(),
    };

    const absence = await Absence.findOneAndUpdate(
      filter,
      { $set: updateData },
      { new: true, upsert: true, setDefaultsOnInsert: true }
    )
      .populate("idTeam", "name")
      .populate("id_Employee", "names surnames photo collectionName");

    res.status(201).json({
      message:
        absence?.__v === 0
          ? "Absence record created successfully"
          : "Absence record updated successfully",
      absence,
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(409).json({
        message: "Absence record already exists for this employee and date",
        error: error.message,
      });
    }
    console.error("Error creating/updating absence:", error);
    res.status(500).json({
      message: "Error creating/updating absence",
      error: error.message,
    });
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
      status: req.body.status,
    };

    Object.keys(updateFields).forEach(
      (key) => updateFields[key] === undefined && delete updateFields[key]
    );

    const absence = await Absence.findByIdAndUpdate(
      req.params.id,
      { $set: updateFields },
      { new: true, runValidators: true }
    )
      .populate("idTeam", "name")
      .populate("id_Employee", "names surnames photo collectionName");

    if (!absence) {
      return res.status(404).json({ message: "Absence record not found" });
    }

    res.status(200).json({
      message: "Absence record updated successfully",
      absence,
    });
  } catch (error) {
    console.error("Error updating absence:", error);
    res.status(500).json({
      message: "Error updating absence",
      error: error.message,
    });
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
    res
      .status(500)
      .json({ message: "Error deleting absence", error: error.message });
  }
};

export default absencesController;
