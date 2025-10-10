import { Schema, model } from "mongoose";

// 📌 Subesquema para cada acción realizada
const actionBySchema = new Schema(
  {
    user: {
      type: String,
      required: true,
      trim: true,
    },
    day: {
      type: Number,
      required: true,
    },
    month: {
      type: Number,
      required: true,
    },
    year: {
      type: Number,
      required: true,
    },
    hour: {
      type: Number,
      required: true,
    },
    min: {
      type: Number,
      required: true,
    },
  },
  { _id: true } // Genera automáticamente un ObjectId
);

// 🧭 Esquema principal de permisos
const permissionsSchema = new Schema(
  {
    idUser: {
      type: String,
      required: true,
    },
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
    idTeam: {
      type: Schema.Types.ObjectId,
      ref: "Teams",
      required: true,
      trim: true,
    },

    // 📌 Ahora `actionBy` es un array de objetos (historial de acciones)
    actionBy: {
      type: [actionBySchema],
      default: [],
    }
    ,

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
      type: String,
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
      required: false,
      default: undefined,
    },
    illnessType: {
      type: String,
      enum: ["Common illness", "Work accident"],
      required: false,
      default: undefined,
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
