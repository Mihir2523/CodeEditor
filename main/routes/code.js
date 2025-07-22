import express from "express";
import jwt from "jsonwebtoken";
import Code from "../models/Code.js";
import redisClient from "../redisClient.js";

const router = express.Router();

const authMiddleware = (req, res, next) => {
  const auth = req.headers.authorization;
  if (!auth) return res.status(401).json({ message: "No token" });

  try {
    const token = auth.split(" ")[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded.id;
    next();
  } catch {
    res.status(401).json({ message: "Invalid token" });
  }
};

router.post("/submit-code", authMiddleware, async (req, res) => {
  const { code } = req.body;
  const codeDoc = await Code.create({
    user: req.user,
    code,
    isComplete: false,
  });

  await redisClient.lPush(
    "codeQueue",
    JSON.stringify({ id: codeDoc._id, code })
  );

  res.json({ message: "Code submitted", jobId: codeDoc._id });
});

router.get("/code/:id", authMiddleware, async (req, res) => {
  const codeDoc = await Code.findById(req.params.id);
  if (!codeDoc) return res.status(404).json({ message: "Not found" });
  res.json(codeDoc);
});

export default router;
