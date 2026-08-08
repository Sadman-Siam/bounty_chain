import { Router } from "express";
import { pinata } from "../lib/pinata.js";

const router = Router();

const CID_PATTERN = /^(Qm[1-9A-HJ-NP-Za-km-z]{44}|b[A-Za-z2-7]{20,})$/;

router.get("/:cid", async (req, res) => {
  const { cid } = req.params;

  if (!CID_PATTERN.test(cid)) {
    return res.status(400).json({ error: "Invalid CID format" });
  }

  try {
    const { data, contentType } = await pinata.gateways.public.get(cid);

    if (contentType) {
      res.setHeader("Content-Type", contentType);
    }
    res.send(data);
  } catch (err) {
    console.error("Fetch error:", err);
    res
      .status(502)
      .json({ error: "Failed to fetch content from Pinata gateway" });
  }
});

export default router;
