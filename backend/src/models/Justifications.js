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
      default: "",
    },
    // 🔹 Relación con el registro de ACCESO (llegadas tarde/salidas tempranas)
    idAccess: {
      type: Schema.Types.ObjectId,
      ref: "Access",
      default: null, //Cambiado a optional
    },
    // 🔹 NUEVO: Relación con el registro de INASISTENCIA
    idAbsence: {
      type: Schema.Types.ObjectId,
      ref: "Absences", // Debe coincidir con el nombre de tu modelo de inasistencias
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

// 🔹 Validación: Debe tener al menos uno de los dos (idAccess o idAbsence)
justificationSchema.pre("save", function (next) {
  if (!this.idAccess && !this.idAbsence) {
    return next(new Error("Se requiere idAccess o idAbsence"));
  }
  next();
});

export default model("Justifications", justificationSchema);
