import { Schema, model } from "mongoose";

const teamSchema = new Schema(
  {
    name: {
      type: String,
      required: true,
      maxLength: 100,
      minLength: 3
    }
  },
  {
    strict: false
  }
);

export default model("Teams", teamSchema);