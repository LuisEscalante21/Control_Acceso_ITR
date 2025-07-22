import { Schema, model } from "mongoose";

// Subesquema para un bloque horario (Matutino o Vespertino)
const TimeBlockSchema = new Schema(
  {
    start: {
      type: String,
      default: null
    },
    end: {
      type: String,
      default: null
    }
  },
  { _id: false }
);

// Subesquema para cada día
const DayScheduleSchema = new Schema(
  {
    Matutino: {
      type: TimeBlockSchema,
      default: null
    },
    Vespertino: {
      type: TimeBlockSchema,
      default: null
    }
  },
  { _id: false }
);

// Esquema principal
const ScheduleSchema = new Schema(
  {
    name: {
      type: String,
      required: true
    },
    Lunes: { type: DayScheduleSchema, default: null },
    Martes: { type: DayScheduleSchema, default: null },
    Miercoles: { type: DayScheduleSchema, default: null },
    Jueves: { type: DayScheduleSchema, default: null },
    Viernes: { type: DayScheduleSchema, default: null },
    Sabado: { type: DayScheduleSchema, default: null },
    Domingo: { type: DayScheduleSchema, default: null }
  },
  {
    timestamps: true,
    collection: "schedule"
  }
);

export default model("schedule", ScheduleSchema);
