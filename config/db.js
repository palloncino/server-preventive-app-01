import dotenv from "dotenv";
const envPath =
  process.env.NODE_ENV === "production" ? ".env.remote" : ".env.local";
dotenv.config({ path: envPath });

import { Sequelize } from "sequelize";

// Dynamically adjust the database connection details based on environment
export const sequelize = new Sequelize(process.env.DB_BASE_URL, {
  dialect: "mysql",
  logging: false,
  pool: {
    max: 5, // Maximum number of connections in pool
    min: 0, // Minimum number of connections in pool
    acquire: 30000, // The maximum time, in milliseconds, that pool will try to get connection before throwing error
    idle: 10000, // The maximum time, in milliseconds, that a connection can be idle before being released
  },
  define: {
    freezeTableName: true, // Prevents sequelize from renaming tables
  },
});

// Function to set max_allowed_packet globally
const setGlobalMaxAllowedPacket = async () => {
  try {
    await sequelize.query("SET GLOBAL max_allowed_packet = 64 * 1024 * 1024"); // Set to 64MB
    console.log("max_allowed_packet set globally to 64MB");
  } catch (error) {
    console.error("Error setting max_allowed_packet globally:", error);
  }
};

// Function to test the connection and sync the models
export const connectDB = async () => {
  try {
    await sequelize.authenticate();
    console.log("Connection has been established successfully.");
    await setGlobalMaxAllowedPacket(); // Attempt to set max_allowed_packet globally
    if (process.env.NODE_ENV === "development") {
      await sequelize.sync();
      console.log("Development: Database models synchronized.");
    }
  } catch (error) {
    console.error("Unable to connect to the database:", error);
  }
};

export default sequelize;
