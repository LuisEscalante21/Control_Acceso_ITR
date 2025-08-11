import { Schema, model } from "mongoose";

const coordinatorsSchema = new Schema(
  {
    numEmpleado: {
      type: String,
      require: true,
      maxLength: 100,
    },
    names: {
      type: String,
      require: true,
      maxLength: 100,
    },
    surnames: {
      type: String,
      require: true,
      maxLength: 100,
    },
    DUI: {
        type: String,
        require: true,
        maxLength: 100,
    }, 
    birthday: {
      type: Date,
      require: true,
    },
    telephone: {
        type: String,
        require: true,
        min: 0,
    },
    email: {
    type: String,
    required: true,
    maxLength: 100,
    match: /^[a-zA-Z0-9._%+-]+@ricaldone\.edu\.sv$/
    },
    password: {
        type: String,
        require: true,
        maxLength: 100,
    },
    hireDate: {
      type: Date,
      require: true,
    },
    IdTeam: {
      type: Schema.Types.ObjectId,
      ref: "teams",
      require: true,
  },
    status: {
        type: Boolean,
        require: true,
    },
    address: {
      type: String,
      require: true,
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

export default model("Coordinators", coordinatorsSchema);