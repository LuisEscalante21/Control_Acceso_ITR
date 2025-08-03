import { Schema, model } from "mongoose";

const justificationSchema = new Schema(
  {
    userId: {
      type: Schema.Types.ObjectId,
      required: true,
    },
    userType: {
      type: String,
      enum: ["Employee", "Coordinator", "Administrator"],
      required: true,
    },
    IdTeam: {
      type: Schema.Types.ObjectId,
      ref: "Teams",
      required: true,
    },
    date: {
      type: Date,
      required: true,
    },
    arrivalTime: {
      type: String,
      required: true,
    },
    reason: {
      type: String,
      required: true,
      maxLength: 500,
    },
    evidenceUrl: {
      type: String,
    },

    // 🔹 Relación con el registro de acceso
    idAccess: {
      type: Schema.Types.ObjectId,
      ref: "Access", // si tienes un modelo Access, si no puedes omitir el `ref`
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

export default model("Justifications", justificationSchema);
