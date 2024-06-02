import { DataTypes, Model } from "sequelize";
import { sequelize } from "../config/db.js";

class Client extends Model {}

Client.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    fiscalCode: {
      type: DataTypes.STRING(16),
      allowNull: false,
    },
    vatNumber: {
      type: DataTypes.STRING(14), // Increase length to 14
      allowNull: false,
    },
    firstName: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    lastName: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    companyName: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    address: {
      type: DataTypes.JSON,
      allowNull: false,
      validate: {
        isAddressValid(value) {
          if (
            !value.street ||
            !value.city ||
            !value.zipCode ||
            !value.country
          ) {
            throw new Error("All address fields must be filled");
          }
        },
      },
    },
    email: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
    },
    mobileNumber: {
      type: DataTypes.STRING,
      allowNull: true,
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
    modelName: "Client",
    tableName: "clients",
    timestamps: true,
  }
);

export default Client;
