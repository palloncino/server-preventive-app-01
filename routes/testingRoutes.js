import express from 'express';
import dotenv from 'dotenv';
import { sendEmail } from '../utils/emailManager.js';
import authMiddleware from '../utils/authMiddleware.js';
const envPath = process.env.NODE_ENV === "production" ? ".env.remote" : ".env.local";
dotenv.config({ path: envPath });

const router = express.Router();

router.post("/send-email", authMiddleware, async (req, res) => {
  const { to, subject, text, html } = req.body;
  
  try {
    const result = await sendEmail(to, subject, text, html);
    res.status(200).json(result);
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

export default router;
