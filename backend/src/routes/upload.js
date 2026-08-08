import { Router } from "express";
import multer from "multer";
import { pinata } from "../lib/pinata.js";

const router = Router();

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 },
});

router.post("/", upload.single("file"), async (req, res) => {
  try {
    if (!req.file) {
      return res
        .status(400)
        .json({ error: "No file provided (expected field name 'file')" });
    }

    const file = new File([req.file.buffer], req.file.originalname, {
      type: req.file.mimetype,
    });

    const result = await pinata.upload.public.file(file);

    res.json({
      cid: result.cid,
      size: result.size,
      name: req.file.originalname,
    });
  } catch (err) {
    console.error("Upload error:", err);
    res.status(500).json({ error: "Failed to upload file to Pinata" });
  }
});

router.post("/json", async (req, res) => {
  try {
    if (!req.body || Object.keys(req.body).length === 0) {
      return res.status(400).json({ error: "Request body is empty" });
    }

    const result = await pinata.upload.public.json(req.body);

    res.json({ cid: result.cid });
  } catch (err) {
    console.error("JSON upload error:", err);
    res.status(500).json({ error: "Failed to upload JSON to Pinata" });
  }
});

export default router;
