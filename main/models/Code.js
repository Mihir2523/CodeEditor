import mongoose from "mongoose";

const codeSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: "Userss" },
  code: String,
  isComplete: { type: Boolean, default: false },
  imageExist: { type: Boolean, default: false },
  imageLink: { type: String, default: "" },
  errors: { type: Boolean, default: false },
  output: { type: String, default: "" },
});

export default mongoose.model("Code", codeSchema);
