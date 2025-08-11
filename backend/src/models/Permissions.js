import { Schema, model } from "mongoose";

// Esquema principal de permisos
const permissionsSchema = new Schema(
  {
    // Datos comunes del colaborador
    employeeNumber: {
      type: String,
      required: true,
      minLength: 3,
      trim: true,
    },
    employeeName: {
      type: String,
      required: true,
      maxLength: 100,
      trim: true,
    },
    department: {
      type: String,
      required: true,
      maxLength: 100,
      trim: true,
    },
    idTeam: {
      type: Schema.Types.ObjectId,
      ref: "Teams",
      required: true,
      trim: true,
    },

    // Quién aprobó o rechazó el permiso
    actionBy: {
      type: String,
      default: null,
      trim: true,
    },

    // Tipo de permiso para solicitar
    permissionType: {
      type: String,
      enum: ["minor", "major", "incapacity"],
      required: true,
    },

    // Día de la solicitud
    applicationDay: {
      type: String,
      required: true,
      trim: true,
    },

    // Estado general del permiso
    status: {
      type: String,
      enum: ["pending", "approved", "rejected", "urgent"],
      default: "pending",
      required: true,
    },

    // Se le podrá hacer descuento al colaborador
    Discount: {
      type: Boolean,
      default: false,
      required: true,
    },
    quantityDiscount: {
      type: Number,
      default: 0,
      min: 0,
    },

    //================================[ Permiso menor (por solo 1 día o menos) ]================================

    permissionDate: {
      type: Date,
      default: null,
    },
    startTime: {
      type: String,
      trim: true,
      default: null,
    },
    endTime: {
      type: String,
      trim: true,
      default: null,
    },
    reason: {
      type: String,
      maxLength: 500,
      trim: true,
      default: null,
    },
    supportingDocument: {
      type: String, // Ruta o URL del documento (común para todos los tipos)
      trim: true,
      default: null,
    },

    //================================[ Permiso mayor (más de 1 día) ]================================

    permissionDateFrom: {
      type: Date,
      default: null,
    },
    permissionDateTo: {
      type: Date,
      default: null,
    },

    //================================[ Incapacidad médica ]================================

    sickLeaveDateFrom: {
      type: Date,
      default: null,
    },
    sickLeaveDateTo: {
      type: Date,
      default: null,
    },
    incapacityType: {
    type: String,
    enum: ["Initial", "Extension"],
    required: false,       // ⬅️ opcional
    default: undefined,    // ⬅️ NO null
},
    illnessType: {
    type: String,
    enum: ["Common illness", "Work accident"],
    required: false,       // ⬅️ opcional
    default: undefined,    // ⬅️ NO null
},

    //================================[ Comentarios y sistema ]================================

    supervisorComments: {
      type: String,
      trim: true,
      maxLength: 500,
      default: null,
    },
  },
  {
    timestamps: true,
    strict: false,
  }
);

export default model("Permissions", permissionsSchema);
