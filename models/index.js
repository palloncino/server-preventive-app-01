import { sequelize } from "../config/db.js";
import User from "./user.js";
import Client from "./client.js";
import Quote from "./quote.js";
import Product from "./product.js";
import Document from "./document.js";

// Sync models with the database
if (process.env.NODE_ENV === "development") {
  sequelize
    .sync()
    .then(() => console.log("Development mode: Database synced"))
    .catch((error) => {
      console.error("Error synchronizing models:", error);
    });
}

export { User, Client, Quote, Product, Document };
