import { Schema, model } from "mongoose";

const faceSchema = new Schema(
  {
    employee_code: {
      type: String,
      required: true,
      unique: true,
    },
    name: {
      type: String,
      required: true,
      maxLength: 100,
    },
    encoding: {
      type: [Number], 
      required: true,
    },
    image_url: {
      type: String,
      required: true, 
    },
    schedule_id: {
      type: Schema.Types.ObjectId,
      ref: "Schedule",
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

export default model("Face", faceSchema);
