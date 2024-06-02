import express from "express";
import User from "../models/user.js"; // Assume User is a Sequelize model
import Logger from "../utils/Logger.js";
import { parseUserProperties } from "../utils/parseUserProperties.js";
import authMiddleware from '../utils/authMiddleware.js';
const router = express.Router();

// Get all users
router.get("/get-users", authMiddleware, async (req, res) => {
  try {
    let users = await User.findAll();
    Logger.debug(`Users fetched: ${JSON.stringify(users)}`);
    users = users.map((user) => parseUserProperties(user));
    Logger.info("Users retrieved and processed successfully.");
    res.status(200).json(users);
  } catch (error) {
    Logger.error(
      `Error retrieving users: ${error.message}, Stack: ${error.stack}`
    );
    res
      .status(500)
      .json({ message: `Error retrieving users: ${error.message}` });
  }
});

// Edit an existing user
router.put("/edit-user", authMiddleware, async (req, res) => {
  const { id } = req.body;

  try {
    const [updatedRows] = await User.update(req.body, {
      where: { id },
    });
    if (!updatedRows) {
      return res.status(404).send("User not found");
    }

    const updatedUser = await User.findByPk(id);
    const parsedUser = parseUserProperties(updatedUser); // Parse properties after updating
    res.status(200).json(parsedUser);
  } catch (error) {
    console.error("Error updating user:", error);
    res.status(500).json({ message: `Error updating user: ${error.message}` });
  }
});

// Delete one or more users
router.delete("/delete-users", authMiddleware, async (req, res) => {
  const { ids } = req.body;

  if (!ids || !Array.isArray(ids)) {
    return res
      .status(400)
      .send("Invalid request, 'ids' must be an array of user IDs.");
  }

  try {
    const result = await User.destroy({
      where: { id: ids },
    });

    if (!result) {
      return res.status(404).send("No users found with the given IDs.");
    }

    res.status(200).json({
      ids,
      message: `Users with IDs: ${ids.join(", ")} were successfully deleted.`,
    });
  } catch (error) {
    res.status(500).json({ message: `Error deleting users: ${error.message}` });
  }
});

export default router;
