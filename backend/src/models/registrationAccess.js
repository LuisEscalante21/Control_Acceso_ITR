import { Schema, model } from "mongoose";

const RegistrationAccessSchema = new Schema({
  id_Employee: { type: Schema.Types.ObjectId, ref: "Employee", required: true },
  date: { type: Date, required: true },

  entry_time: { type: Date },
  entry_result: { 
    type: String, 
    enum: ["A tiempo", "Tarde", "Sin horario asignado", "Horario incompleto"], 
    default: null 
  },
  entry_photo: { type: String },

  exit_time: { type: Date },
  exit_result: { 
    type: String, 
    enum: ["A tiempo", "Salió antes", "Sin horario asignado", "Horario incompleto"], 
    default: null 
  },
  exit_photo: { type: String },

  tipo_registro: { 
    type: String, 
    enum: ["entrada", "salida", "entrada y salida", "desconocido"], 
    default: "desconocido" 
  },
  user_type: { 
    type: String, 
    enum: ["Employee", "Coordinator", "Administrator"], 
    required: true 
  }
}, { timestamps: true });

// La colección se llama registrationAccess explícitamente:
export default model("RegistrationAccess", RegistrationAccessSchema, "registrationAccess");
