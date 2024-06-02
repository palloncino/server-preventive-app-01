import dotenv from "dotenv";
const envPath =
  process.env.NODE_ENV === "production" ? ".env.remote" : ".env.local";
dotenv.config({ path: envPath });
import bcrypt from "bcryptjs";
import express from "express";
import jwt from "jsonwebtoken";
import User from "../models/user.js"; // Adjust the import to your Sequelize User model

const router = express.Router();

router.post("/login", async (req, res) => {
  const { email, password } = req.body;

  try {
    const user = await User.findOne({ where: { email } });

    if (!user) {
      return res
        .status(401)
        .json({
          message:
            "Invalid email or password, there is no user with that email",
        });
    }

    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
      return res
        .status(401)
        .json({
          message: "Invalid email or password, the credentials do not match",
        });
    }

    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role },
      process.env.SECRET_KEY,
      { expiresIn: "1h" }
    );

    res
      .status(200)
      .json({ message: "Authentication successful!", token, user });
  } catch (error) {
    console.error("Error during login:", error);
    res
      .status(500)
      .json({ message: "Error during login", error: error.message });
  }
});

router.post("/verify-token", async (req, res) => {
  const { token } = req.body;
  if (!token) {
    return res.status(400).json({ message: "Token is required" });
  }
  try {
    const decoded = jwt.verify(token, process.env.SECRET_KEY);
    const user = await User.findByPk(decoded.id);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    res.json({ message: "Token verified successfully", user });
  } catch (err) {
    res
      .status(401)
      .json({ message: "Invalid or expired token", error: err.message });
  }
});

router.post("/signup", async (req, res) => {
  const { username, firstName, lastName, companyName, email, password } =
    req.body;

  try {
    const existingUser = await User.findOne({ where: { email } });
    if (existingUser) {
      return res
        .status(409)
        .json({ message: "User already exists with the same email" });
    }

    // Create the new user
    const newUser = await User.create({
      username,
      firstName,
      lastName,
      companyName,
      email,
      password, // Pass the password directly, it will be hashed by the model hook
      role: "user",
    });

    res
      .status(201)
      .json({ message: "User registered successfully!", user: newUser });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Error registering user: " + error.message });
  }
});

export default router;
