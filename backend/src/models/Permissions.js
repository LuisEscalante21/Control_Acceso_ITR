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
      type: String,
      required: true,
      trim: true,
      type: Schema.Types.ObjectId,
      ref: "Teams",
      required: true,
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

    // Se le podrá hacer descuento al coordinador o empleado
    Discount: {
      type: Boolean,
      default: false,
      required: true,
    },
    // Si Discount es true, se le podrá hacer descuento al empleado o coordinador
    quantityDiscount: {
      type: Number,
      default: 0,
      min: 0,
    },

    //================================[ Permiso menor (por solo 1 día o menos) ]================================

    // Día para la ausencia
    permissionDate: {
      type: Date,
      default: null,
    },
    // Inicio de horario de ausencia
    startTime: {
      type: String,
      trim: true,
      default: null,
    },
    // Fin de horario de ausencia
    endTime: {
      type: String,
      trim: true,
      default: null,
    },
    // Motivo del permiso menor
    reason: {
      type: String,
      maxLength: 500,
      trim: true,
      default: null,
    },
    // Documento o justificante del permiso menor (opcional)
    supportingDocument: {
      type: String, // Ruta o URL del documento
      trim: true,
      default: null,
    },

    //================================[ Permiso mayor (más de 1 día) ]================================

    // Rango de fechas para la ausencia
    permissionDateFrom: {
      type: Date,
      default: null,
    },
    permissionDateTo: {
      type: Date,
      default: null,
    },
    // La razón del permiso mayor es igual a la del permiso menor

    // Documentos de respaldo (obligatorios)
    supportingDocuments: {
      type: [String],
      default: [],
    },
    // Carta de solicitud adjunta
    requestLetter: {
      type: String,
      trim: true,
      default: null,
    },

    // Comentarios del supervisor (opcional)
    supervisorComments: {
      type: String,
      trim: true,
      maxLength: 500,
      default: null,
    },

    //================================[ Incapacidad ]================================

    // sickLeaveDateFrom y sickLeaveDateTo son equivalentes a permissionDateFrom y To
    sickLeaveDateFrom: {
      type: Date,
      default: null,
    },
    sickLeaveDateTo: {
      type: Date,
      default: null,
    },

    // Se elige el tipo de incapacidad
    incapacityType: {
      type: String,
      enum: ["Initial", "Extension"],
      default: null,
    },

    // Incapacidad por enfermedad o accidente
    illnessType: {
      type: String,
      enum: ["Common illness", "Work accident"],
      default: null,
    },

    // La razón del permiso de incapacidad es igual a la del permiso menor

    // Documento o justificante de la incapacidad (obligatorio)
    sickLeaveDocument: {
      type: String,
      trim: true,
      default: null,
    },

    // Incapacidad particular
    privateSickLeave: {
      type: Boolean,
      default: false,
    },
    // Incapacidad del ISSS
    isssSickLeave: {
      type: Boolean,
      default: false,
    },

    // Comentarios del supervisor (opcional)
    // (Ya cubierto en supervisorComments si se reutiliza el mismo campo)
  },
  {
    timestamps: true,
    strict: false,
  }
);

export default model("Permissions", permissionsSchema);
