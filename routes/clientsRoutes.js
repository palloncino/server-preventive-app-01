import express from "express";
import Client from "../models/client.js";
import Logger from "../utils/Logger.js";
import { parseUserProperties } from "../utils/parseUserProperties.js";
import authMiddleware from '../utils/authMiddleware.js';
const router = express.Router();

// Get all clients
router.get("/get-clients", authMiddleware, async (req, res) => {
  try {
    let clients = await Client.findAll();
    Logger.debug(`Clients fetched: ${JSON.stringify(clients)}`);
    clients = clients.map((client) => parseUserProperties(client));
    Logger.info("Clients retrieved and processed successfully.");
    res.status(200).json(clients);
  } catch (error) {
    Logger.error(
      `Error retrieving clients: ${error.message}, Stack: ${error.stack}`
    );
    res
      .status(500)
      .json({ message: `Error retrieving clients: ${error.message}` });
  }
});

// Create a new client
router.post("/create-client", authMiddleware, async (req, res) => {
  try {
    const newClient = await Client.create(req.body);
    Logger.info(`Client created: ${JSON.stringify(newClient)}`);
    res.status(201).json(newClient);
  } catch (error) {
    Logger.error(
      `Error creating client: ${error.message}, Stack: ${error.stack}`
    );
    res
      .status(500)
      .json({ message: `Error creating client: ${error.message}` });
  }
});

// Edit an existing client
router.put("/edit-client", authMiddleware, async (req, res) => {
  const { id } = req.body;

  try {
    const [updatedRows] = await Client.update(req.body, {
      where: { id },
    });
    if (!updatedRows) {
      return res.status(404).send("Client not found");
    }

    const updatedClient = await Client.findByPk(id);
    const parsedClient = parseUserProperties(updatedClient); // Parse properties after updating
    res.status(200).json(parsedClient);
  } catch (error) {
    Logger.error(
      `Error updating client: ${error.message}, Stack: ${error.stack}`
    );
    res
      .status(500)
      .json({ message: `Error updating client: ${error.message}` });
  }
});

// Delete one or more clients
router.delete("/delete-clients", authMiddleware, async (req, res) => {
  const { ids } = req.body;

  if (!ids || !Array.isArray(ids)) {
    return res
      .status(400)
      .send("Invalid request, 'ids' must be an array of client IDs.");
  }

  try {
    const result = await Client.destroy({
      where: { id: ids },
    });

    if (!result) {
      return res.status(404).send("No clients found with the given IDs.");
    }

    res.status(200).json({
      ids,
      message: `Clients with IDs: ${ids.join(", ")} were successfully deleted.`,
    });
  } catch (error) {
    Logger.error(
      `Error deleting clients: ${error.message}, Stack: ${error.stack}`
    );
    res
      .status(500)
      .json({ message: `Error deleting clients: ${error.message}` });
  }
});

export default router;
