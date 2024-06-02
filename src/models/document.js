import { DataTypes, Model } from "sequelize";
import { sequelize } from "../config/db.js";
import { initialStatus } from "../utils/staticStatuses.js";

class Document extends Model {}

Document.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    hash: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
    },
    data: {
      type: DataTypes.JSON,
      allowNull: false,
    },
    createdAt: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
    },
    updatedAt: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
    },
    expiresAt: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    status: {
      type: DataTypes.JSON,
      defaultValue: initialStatus,
    },
    signedAt: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    clientSignature: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    ownerSignature: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    userId: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    clientEmail: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    otp: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    readonly: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },
    followUpSent: {
      type: DataTypes.JSON,
      defaultValue: { immediate: false, reminder: false, expiration: false },
    },
    history: {
      type: DataTypes.JSON,
      allowNull: true,
      defaultValue: [],
    },
    note: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    uploadedFiles: {
      type: DataTypes.JSON,
      allowNull: true,
      defaultValue: [],
    },
  },
  {
    sequelize,
    modelName: "Document",
    tableName: "documents",
    timestamps: true,
  }
);

export default Document;


// -- SQL commands to drop and recreate the table with the new field
// DROP TABLE IF EXISTS documents;

// CREATE TABLE documents (
//   id INT AUTO_INCREMENT PRIMARY KEY,
//   hash VARCHAR(255) NOT NULL UNIQUE,
//   data JSON NOT NULL,
//   createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
//   updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
//   expiresAt TIMESTAMP NULL,
//   status JSON NOT NULL DEFAULT '[{"name": "DOCUMENT_OPENED", "value": false}, {"name": "EMAIL_OTP", "value": false}, {"name": "CLIENT_SIGNATURE", "value": false}, {"name": "STORAGE_CONFIRMATION", "value": false}, {"name": "EXPIRED", "value": false}, {"name": "REJECTED", "value": false}]',
//   signedAt TIMESTAMP NULL,
//   clientSignature TEXT NULL,
//   ownerSignature TEXT NULL,
//   userId INT NOT NULL,
//   clientEmail VARCHAR(255) NOT NULL,
//   otp VARCHAR(255) NOT NULL,
//   readonly BOOLEAN DEFAULT FALSE,
//   followUpSent JSON DEFAULT '{"immediate": false, "reminder": false, "expiration": false}',
//   history JSON NULL DEFAULT '[]',
//   note TEXT NULL,
//   uploadedFiles JSON NULL DEFAULT '[]'
// );
