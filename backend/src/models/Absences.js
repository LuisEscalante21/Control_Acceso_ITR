import { Schema, model } from "mongoose";

const absencesSchema = new Schema(
  {
    // 🔹 Referencia al empleado (quién)
    id_Employee: {
      // Usamos String, ya que el ID puede ser un ObjectId o un numEmpleado (si viene de colecciones de caras)
      type: String, 
      required: true,
      maxLength: 100,
      // Aunque se guarda como String, la referencia es conceptual. 
      // Si siempre usas el ObjectId del empleado, puedes cambiar a:
      // type: Schema.Types.ObjectId, 
      // ref: "Employees", 
      // Pero 'String' es más flexible para IDs mixtos.
    },
    
    // 🔹 Información de la inasistencia (cuándo y por qué)
    date: {
      // Fecha de la inasistencia (YYYY-MM-DD), es mejor guardarla como String para búsquedas simples
      type: String, 
      required: true,
      maxLength: 10, // Ej: "2025-09-27"
      index: true, // Útil para búsquedas rápidas por fecha
    },
    reason: {
      // Tipo de inasistencia: "Ausencia total", "Ausencia de entrada", "Ausencia de salida"
      type: String,
      required: true,
      enum: ["Ausencia total", "Ausencia de entrada", "Ausencia de salida"],
      maxLength: 50,
    },
    registered_at: {
      // Marca de tiempo de cuándo se insertó este registro de inasistencia
      type: Date,
      default: Date.now,
    },

    // 🔹 Metadatos (Contexto del empleado en el momento del registro)
    names: {
      type: String,
      required: false, // No obligatorio, pero útil
      maxLength: 100,
    },
    surnames: {
      type: String,
      required: false, // No obligatorio, pero útil
      maxLength: 100,
    },
    employee_type: {
      // Rol del usuario: "Employee", "Coordinator", etc.
      type: String,
      required: false, 
      maxLength: 50,
    },
  },
  {
    timestamps: true, // Añade createdAt y updatedAt automáticamente
    strict: true,     // Asegura que solo se guarden los campos definidos en el esquema
  }
);

// 🔹 Índice Único para evitar duplicados
// Un empleado solo puede tener una inasistencia registrada por día
absencesSchema.index({ id_Employee: 1, date: 1 }, { unique: true });

export default model("Absences", absencesSchema);