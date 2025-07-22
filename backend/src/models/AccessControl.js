import { Schema, model } from "mongoose";

const AccessControlSchema = new Schema(
  {
    id_Employee: {
      type: Schema.Types.ObjectId,
      ref: "Employees",
      required: true
    },
    entry_time: {
      type: Date,
      required: true
    },
    entry_result: {
      type: String,
      enum: ["puntual", "tarde", "ausente"],
      required: true
    },
    entry_photo: {
      type: String
    },
    exit_time: {
      type: Date
    },
    exit_result: {
      type: String,
      enum: ["completado", "incompleto", "pendiente"]
    },
    exit_photo: {
      type: String
    },
    date: {
      type: Date,
      required: true
    }
  },
  {
    timestamps: true,
    collection: "registrationAccess"
  }
);

export default model("registrationAccess", AccessControlSchema);
