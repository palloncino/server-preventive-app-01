import cron from "node-cron";
import { Op } from "sequelize";
import Document from "../models/document.js";
import { sendReminderEmail } from "./emailManager.js";

// Schedule cron job to run every day at a specific time (e.g., midnight)
cron.schedule("0 0 * * *", async () => {
  try {
    // Find documents that need reminder emails (immediate is true and reminder is false)
    const reminderDocuments = await Document.findAll({
      where: {
        followUpSent: {
          immediate: true,
          reminder: false,
          expiration: false,
        },
        createdAt: {
          [Op.lt]: new Date(new Date() - 7 * 24 * 60 * 60 * 1000), // Created more than 7 days ago
        },
      },
    });

    // Send reminder emails for each document
    for (const document of reminderDocuments) {
      await sendReminderEmail(document);
      // Update document to mark reminder as sent
      await document.update({
        followUpSent: { ...document.followUpSent, reminder: true },
      });
    }
  } catch (error) {
    console.error("Error in email scheduler:", error);
  }
});
