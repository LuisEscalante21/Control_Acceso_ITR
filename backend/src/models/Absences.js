import { Schema, model } from "mongoose";

const absencesSchema = new Schema(
  {
    // 🔹 Referencia al empleado (quién)
    id_Employee: {
      type: String,
      required: true,
      maxLength: 100,
    },
    
    // 🔹 Información de la inasistencia (cuándo y por qué)
    date: {
      type: String,
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

    // 🔹 Metadatos del empleado
    names: { type: String, maxLength: 100 },
    surnames: { type: String, maxLength: 100 },
    employee_type: { type: String, maxLength: 50 },

    // 🔹 Relación con un equipo (si aplica)
    idTeam: { 
      type: Schema.Types.ObjectId, 
      ref: "Teams",
    },
    // 🔹 Estado de la inasistencia
    status: {
      type: String,
      enum: ["pendiente", "justificada"],
      default: "pendiente",
    },
  },
  {
    timestamps: true, // createdAt y updatedAt
    strict: true,     // sigue impidiendo campos no definidos
  }
);

// 🔹 Índice Único: un empleado solo puede tener una ausencia por día
absencesSchema.index({ id_Employee: 1, date: 1 }, { unique: true });

export default model("Absences", absencesSchema);
