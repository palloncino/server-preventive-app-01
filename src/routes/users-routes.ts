import express from "express";
import User from "../models/user";
import Logger from "../utils/Logger";
import authMiddleware from "../utils/auth-middleware";

const router = express.Router();

// Get all users
router.get("/get-users", authMiddleware, async (req, res) => {
  try {
    let users = await User.find();
    Logger.debug(`Users fetched: ${JSON.stringify(users)}`);
    Logger.info("Users retrieved and processed successfully.");
    res.status(200).json(users);
  } catch (error) {
    Logger.error(
      `Error retrieving users: ${(error as Error).message}, Stack: ${(error as Error).stack}`
    );
    res
      .status(500)
      .json({ message: `Error retrieving users: ${(error as Error).message}` });
  }
});

// Edit an existing user
router.put("/edit-user", authMiddleware, async (req, res) => {
  const { id } = req.body;

  try {
    const updatedUser = await User.findByIdAndUpdate(id, req.body, {
      new: true,
    });
    if (!updatedUser) {
      return res.status(404).send("User not found");
    }
    res.status(200).json(updatedUser);
  } catch (error) {
    Logger.error(
      `Error updating user: ${(error as Error).message}, Stack: ${(error as Error).stack}`
    );
    res.status(500).json({ message: `Error updating user: ${(error as Error).message}` });
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
    const result = await User.deleteMany({ _id: { $in: ids } });

    if (result.deletedCount === 0) {
      return res.status(404).send("No users found with the given IDs.");
    }

    res.status(200).json({
      ids,
      message: `Users with IDs: ${ids.join(", ")} were successfully deleted.`,
    });
  } catch (error) {
    Logger.error(
      `Error deleting users: ${(error as Error).message}, Stack: ${(error as Error).stack}`
    );
    res.status(500).json({ message: `Error deleting users: ${(error as Error).message}` });
  }
});

export default router;
