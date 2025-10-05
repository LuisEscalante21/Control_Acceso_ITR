import { Schema, model } from "mongoose";

const absencesSchema = new Schema(
  {
    // 🔹 Referencia al empleado (quién)
    id_Employee: {
      type: String, // Usamos String por flexibilidad (ObjectId, numEmpleado, etc.)
      required: true,
      maxLength: 100,
    },
    
    // 🔹 Información de la inasistencia (cuándo y por qué)
    date: {
      type: String, // Guardamos como "YYYY-MM-DD" para búsquedas simples
      required: true,
      maxLength: 10,
      index: true,
    },
    reason: {
      type: String,
      required: true,
      enum: ["Ausencia total", "Ausencia de entrada", "Ausencia de salida"],
      maxLength: 50,
    },
    registered_at: {
      type: Date,
      default: Date.now,
    },

    // 🔹 Metadatos (información extra del empleado)
    names: {
      type: String,
      required: false,
      maxLength: 100,
    },
    surnames: {
      type: String,
      required: false,
      maxLength: 100,
    },
    employee_type: {
      type: String, // Ej: "Employee", "Coordinator"
      required: false,
      maxLength: 50,
    },

    // 🔹 Relación con un equipo (si aplica)
    idTeam: { 
      type: Schema.Types.ObjectId, 
      ref: "Teams",
      required: false,
    },
  },
  {
    timestamps: true, // createdAt y updatedAt
    strict: true,     // Solo permite campos definidos en el esquema
  }
);

// 🔹 Índice Único: un empleado solo puede tener una ausencia por día
absencesSchema.index({ id_Employee: 1, date: 1 }, { unique: true });

export default model("Absences", absencesSchema);
