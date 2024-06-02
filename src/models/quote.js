import { DataTypes, Model } from "sequelize";
import { sequelize } from "../config/db.js";

class Quote extends Model {}

Quote.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    userId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      comment: "The ID of the user who created the quote",
    },
    company: {
      type: DataTypes.STRING,
      allowNull: false,
      comment: "The company for which the quote is prepared",
    },
    object: {
      type: DataTypes.STRING,
      allowNull: false,
      comment: "The main subject or title of the quote",
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true,
      comment: "Detailed information about what the quote includes",
    },
    commissioner: {
      type: DataTypes.JSON,
      allowNull: true,
      comment: "Information about the commissioner as a JSON object",
    },
    subtotal: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: true,
    },
    total: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: true,
    },
    notes: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    issuedDate: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    expiryDate: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    pdfUrl: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    data: {
      type: DataTypes.JSON,
      allowNull: true,
      comment: "Additional data related to the quote as a JSON object",
    },
    createdAt: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
    },
    updatedAt: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
    },
  },
  {
    sequelize,
    modelName: "Quote",
    tableName: "quotes",
    timestamps: true,
  }
);

export default Quote;
