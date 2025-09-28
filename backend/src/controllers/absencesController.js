import Absence from "../models/Absences.js"; //

const absencesController = {};

// --------------------------------------------------------------------------
// 🔹 GET ALL (Obtener todas las inasistencias)
// --------------------------------------------------------------------------
absencesController.getAbsences = async (req, res) => {
  try {
    // Puedes añadir filtros, paginación o populate aquí si fuera necesario
    const absences = await Absence.find().sort({ date: -1, createdAt: -1 });
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
    const absence = await Absence.findById(req.params.id);
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
      date, // Formato YYYY-MM-DD
      reason, // "Ausencia total", "Ausencia de entrada", "Ausencia de salida"
      names,
      surnames,
      employee_type,
    } = req.body;

    // 1. 🔹 Validación de campos mínimos
    if (!id_Employee?.trim() || !date?.trim() || !reason?.trim()) {
      return res.status(400).json({ message: "Missing required fields: id_Employee, date, or reason" });
    }
    
    // 2. 🔹 Definir el filtro de búsqueda (para upsert)
    const filter = { id_Employee, date };

    // 3. 🔹 Definir los datos a insertar/actualizar
    const updateData = {
        id_Employee,
        date,
        reason,
        names,
        surnames,
        employee_type,
        registered_at: new Date(), // Actualiza la fecha de registro en cada upsert
        // No incluimos 'createdAt' aquí, ya que 'timestamps: true' lo maneja Mongoose
    };

    // 4. 🔹 Ejecutar FindOneAndUpdate con upsert: true
    const absence = await Absence.findOneAndUpdate(
        filter, 
        { $set: updateData }, 
        { new: true, upsert: true, setDefaultsOnInsert: true }
    );

    res.status(201).json({
      message: absence.__v === 0 ? "Absence record created successfully" : "Absence record updated successfully",
      absence,
    });
  } catch (error) {
    // 🚨 Manejar error de índice único si el script intenta insertarlo dos veces
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
    // No se necesita desestructurar todos los campos, solo los que se actualizan
    const updateFields = {
        reason: req.body.reason,
        names: req.body.names,
        surnames: req.body.surnames,
        employee_type: req.body.employee_type,
        date: req.body.date, // Actualizar la fecha es peligroso, pero lo permitimos si es necesario
    };
    
    // Eliminar campos indefinidos para no sobrescribir con null
    Object.keys(updateFields).forEach(key => updateFields[key] === undefined && delete updateFields[key]);


    const absence = await Absence.findByIdAndUpdate(
        req.params.id, 
        { $set: updateFields },
        { new: true, runValidators: true }
    );

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