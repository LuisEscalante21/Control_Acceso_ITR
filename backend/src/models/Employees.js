import { Schema, model } from "mongoose";

const employeesSchema = new Schema(
  {
    numEmpleado: {
      type: String,
      required: true,
      maxLength: 100,
    },
    names: {
      type: String,
      required: true,
      maxLength: 100,
    },
    surnames: {
      type: String,
      required: true,
      maxLength: 100,
    },
    DUI: {
      type: String,
      required: true,
      maxLength: 100,
    },
    birthday: {
      type: Date,
      required: true,
    },
    telephone: {
      type: String,
      required: true,
      min: 0,
    },
    email: {
      type: String,
      required: true,
      maxLength: 100,
      match: /^[a-zA-Z0-9._%+-]+@ricaldone\.edu\.sv$/,
    },
    password: {
      type: String,
      required: true,
      maxLength: 100,
    },
    hireDate: {
      type: Date,
      required: true,
    },
    IdTeam: {
      type: Schema.Types.ObjectId,
      ref: "Teams",
      required: true,
    },
    status: {
      type: Boolean,
      required: true,
    },
    address: {
      type: String,
      required: true,
      maxLength: 200,
    },
    photo: {
      type: String, // Puede ser una URL o el nombre del archivo
      required: false, // No es obligatorio
    },

    
    //Contador de intentos fallidos de inicio de sesión
    loginAttempts: {
      type: Number,
      default: 0,
    },
    //tiempo del último intento fallido de inicio de sesión
    lockTime: {
      type: Date,
      default: null,
    },


  },
  {
    timestamps: true,
    strict: false,
  }
);

export default model("Employees", employeesSchema);
