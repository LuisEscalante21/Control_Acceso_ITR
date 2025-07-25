import { Schema, model } from "mongoose";

const AccessControlSchema = new Schema(
  {
    id_Employee: {
      type: Schema.Types.ObjectId,
      ref: "Employees",
      required: true
    },
    entry_time: {
      type: Date
    },
    entry_result: {
      type: String,
      enum: ["A tiempo", "Tarde", "Sin horario asignado"]
    },
    entry_photo: {
      type: String
    },
    exit_time: {
      type: Date
    },
    exit_result: {
      type: String,
      enum: ["A tiempo", "Salió antes", "Sin horario asignado"]
    },
    exit_photo: {
      type: String
    },
    date: {
      type: String, // YYYY-MM-DD
      required: true
    }
  },
  {
    timestamps: true,
    collection: "registrationAccess"
  }
);

export default model("registrationAccess", AccessControlSchema);
