import express from "express";
import cors from "cors";
import "dotenv/config";

import uploadRoutes from "./routes/upload.js";
import fetchRoutes from "./routes/fetch.js";

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

app.get("/health", (req, res) => {
  res.json({ status: "ok" });
});

app.use("/upload", uploadRoutes);
app.use("/fetch", fetchRoutes);

app.use((err, req, res, next) => {
  console.error("Unhandled error:", err);
  res.status(500).json({ error: "Internal server error" });
});

app.listen(PORT, () => {
  console.log(`BountyPulse backend listening on http://localhost:${PORT}`);
});
