import dotenv from "dotenv";
import express from "express";
import fs from "fs";
import multer from "multer";
import path from "path";
import { sequelize } from "../config/db.js";
import Product from "../models/product.js";
import Logger from "../utils/Logger.js";
import { parseProductProperties } from "../utils/parseProductProperties.js";
import authMiddleware from '../utils/authMiddleware.js';
const envPath =
  process.env.NODE_ENV === "production" ? ".env.remote" : ".env.local";
dotenv.config({ path: envPath });

const router = express.Router();

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, process.env.IMAGES_FOLDER_PATH);
  },
  filename: (req, file, cb) => {
    cb(null, `${Date.now()}-${file.originalname}`);
  },
});

const upload = multer({ storage: storage });

router.get("/get-products", authMiddleware, async (req, res) => {
  try {
    let products = await Product.findAll();
    Logger.debug(`Products fetched: ${JSON.stringify(products)}`);
    products = products.map((product) => parseProductProperties(product));
    Logger.info("Products retrieved and processed successfully.");
    res.status(200).json(products);
  } catch (error) {
    Logger.error(
      `Error retrieving products: ${error.message}, Stack: ${error.stack}`
    );
    res
      .status(500)
      .json({ message: "Error retrieving products: " + error.message });
  }
});

router.post("/create-product", authMiddleware, upload.single("image"), async (req, res) => {
  Logger.info(
    `Received create-product request with data: ${JSON.stringify(req.body)}`
  );

  if (req.file && req.file.size > process.env.MAX_IMAGE_SIZE) {
    fs.unlinkSync(req.file.path); // delete the file
    return res.status(413).json({ message: "Image too large" });
  }

  try {
    const components =
      typeof req.body.components === "string"
        ? JSON.parse(req.body.components)
        : req.body.components;
    const documentation =
      typeof req.body.documentation === "string"
        ? JSON.parse(req.body.documentation)
        : req.body.documentation;

    const productPayload = {
      ...req.body,
      components: components,
      documentation: documentation,
      imgUrl: req.file
        ? `${process.env.BASE_URL}${
            process.env.CUSTOM_HTTP_PORT
              ? ":" + process.env.CUSTOM_HTTP_PORT
              : ""
          }/images/${req.file.filename}`
        : null,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    Logger.debug(
      `Product payload before saving: ${JSON.stringify(productPayload)}`
    );

    const newProduct = await Product.create(productPayload);
    const parsedProduct = parseProductProperties(newProduct);
    Logger.info(`Product created successfully with ID: ${newProduct.id}`);
    res.status(201).json(parsedProduct);
  } catch (error) {
    Logger.error(`Error creating product: ${error.message}`, {
      requestBody: req.body,
    });
    res
      .status(400)
      .json({ message: "Error creating product: " + error.message });
  }
});

router.put("/edit-product", authMiddleware, upload.single("image"), async (req, res) => {
  const id = parseInt(req.body.id, 10);
  if (isNaN(id)) {
    return res.status(400).send("Invalid product ID provided");
  }

  try {
    const updates = {
      name: req.body.name,
      description: req.body.description,
      price: req.body.price,
      category: req.body.category,
      components: req.body.components,
      documentation: req.body.documentation,
      updatedAt: new Date(),
    };

    if (req.file) {
      updates.imgUrl = `${process.env.BASE_URL}/images/${req.file.filename}`;
    }

    Logger.debug(`Product update payload: ${JSON.stringify(updates)}`);

    const [updateCount] = await Product.update(updates, { where: { id } });
    if (updateCount === 0) {
      if (req.file) fs.unlinkSync(req.file.path); // delete the file if no update
      Logger.warn(`Product not found for update: ID ${id}`);
      return res.status(404).send("Product not found");
    }

    const updatedProduct = await Product.findByPk(id);
    if (!updatedProduct) {
      Logger.warn(`Failed to retrieve updated product: ID ${id}`);
      return res.status(404).send("Updated product not found");
    }

    const parsedProduct = parseProductProperties(updatedProduct);
    Logger.info(`Product ID ${id} updated successfully.`);
    res.status(200).json(parsedProduct);
  } catch (error) {
    if (req.file) fs.unlinkSync(req.file.path); // delete the file if error
    Logger.error(`Error updating product ID ${id}: ${error.message}`);
    res
      .status(500)
      .json({ message: "Error updating product: " + error.message });
  }
});

router.delete("/delete-products", authMiddleware, async (req, res) => {
  const rawIds = req.body.ids;

  Logger.info(
    `Received request to delete products with raw IDs: ${rawIds.join(", ")}`
  );

  const idsToDelete = rawIds.map((id) => parseInt(id, 10));
  if (idsToDelete.some(isNaN)) {
    Logger.error("Invalid delete request: all 'ids' must be valid integers");
    return res
      .status(400)
      .send("Invalid request, all 'ids' must be valid integers.");
  }

  const transaction = await sequelize.transaction();
  try {
    const productsToDelete = await Product.findAll({
      where: { id: idsToDelete },
    });

    const result = await Product.destroy({
      where: { id: idsToDelete },
      transaction,
    });
    if (result === 0) {
      await transaction.rollback();
      Logger.warn(
        `No products found with given IDs: ${idsToDelete.join(", ")}`
      );
      return res.status(404).send("No products found with the given IDs.");
    }

    // Delete the image files associated with the products
    productsToDelete.forEach((product) => {
      if (product.imgUrl) {
        const filePath = path.join(
          process.env.IMAGES_FOLDER_PATH,
          path.basename(product.imgUrl)
        );
        if (fs.existsSync(filePath)) {
          try {
            fs.unlinkSync(filePath);
            Logger.info(`Successfully deleted file: ${filePath}`);
          } catch (error) {
            Logger.error(`Error deleting file: ${filePath}`, error.message);
          }
        } else {
          Logger.warn(`File not found: ${filePath}`);
        }
      }
    });

    await transaction.commit();
    Logger.info(
      `${result} products with IDs: ${idsToDelete.join(
        ", "
      )} successfully deleted.`
    );
    res.status(200).send({
      ids: idsToDelete,
      message: `${result} products with IDs: ${idsToDelete.join(
        ", "
      )} were successfully deleted.`,
    });
  } catch (error) {
    await transaction.rollback();
    Logger.error(
      `Error deleting products with IDs ${idsToDelete.join(", ")}: ${
        error.message
      }`
    );
    res
      .status(500)
      .json({ message: "Error deleting products: " + error.message });
  }
});

export default router;
