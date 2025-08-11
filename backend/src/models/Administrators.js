import { Schema, model } from "mongoose";

const AdministratorSchema = new Schema(
{
        numEmpleado: {
            type: String,
            required: true,
            unique: true
        },
        names: {
            type: String,
            required: true
        },
        surnames: {
            type: String,
            required: true
        },
        DUI: {
            type: String,
            required: true,
            unique: true
        },
        birthday: {
            type: Date,
            required: true
        },
        telephone: {
            type: String,
            required: true
        },
        email: {
            type: String,
            required: true,
            unique: true
        },
        password: {
            type: String,
            required: true
        },
        hireDate: {
            type: Date,
            required: true
        },
        IdTeam: {
            type: Schema.Types.ObjectId,
            ref: "teams",
            require: true,
        },
        status: {
            type: Boolean,
            required: true
        },
        address: {
            type: String,
            required: true
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
    }
);

export default model('Administrator', AdministratorSchema);