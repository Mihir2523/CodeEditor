import express from "express";
import mongoose from "mongoose";
import cors from "cors";
import dotenv from "dotenv";
import authRoutes from "./routes/auth.js";
import codeRoutes from "./routes/code.js";

dotenv.config();

const app = express();
app.use(cors({
  origin: "https://codeeditor-1-ojo3.onrender.com",
  credentials: true,       
}));
app.use(express.json());
app.use("/static", express.static("static"));

app.use(authRoutes);
app.use(codeRoutes);

mongoose.connect(process.env.MONGO_URI).then(() => {
  console.log("MongoDB connected");
  app.listen(process.env.PORT, () =>
    console.log("Server running on port", process.env.PORT)
  );
});
