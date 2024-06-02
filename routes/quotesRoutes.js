import dotenv from "dotenv";
import express from "express";
import fs from "fs";
import path from "path";
import Quote from "../models/quote.js";
import Logger from "../utils/Logger.js";
import { generatePDF } from "../utils/generatePDF.js";
import { safelyParseJSON } from "../utils/safelyParseJSON.js";
import authMiddleware from '../utils/authMiddleware.js';

const envPath =
  process.env.NODE_ENV === "production" ? ".env.remote" : ".env.local";
dotenv.config({ path: envPath });

const router = express.Router();

router.get("/get-quotes", async (req, res) => {
  try {
    const quotes = await Quote.findAll({ raw: true });

    const processedQuotes = quotes.map((quote) => {
      const commissioner = safelyParseJSON(quote.commissioner);

      return {
        ...quote,
        pdfUrl: quote.pdfUrl ? new URL(quote.pdfUrl).href : "No PDF available",
        commissioner: commissioner,
      };
    });

    Logger.info("Quotes retrieved and processed successfully.");
    res.status(200).json(processedQuotes);
  } catch (error) {
    Logger.error(
      `Error retrieving quotes: ${error.message}, Stack: ${error.stack}`
    );
    res
      .status(500)
      .json({ message: "Error retrieving quotes: " + error.message });
  }
});

router.post("/create-quote", authMiddleware, async (req, res) => {
  try {
    const documentData = req.body;

    const calculateSubtotal = (products) => {
      let subtotal = 0;
      products.forEach((product) => {
        subtotal += parseFloat(product.price) || 0;
        if (product.components) {
          product.components.forEach((component) => {
            if (component.included) {
              subtotal += parseFloat(component.price) || 0;
            }
          });
        }
      });
      return subtotal;
    };

    const applyTaxes = (amount, taxRate) => amount * (1 + taxRate);

    const taxRate = 0.22; // 22% tax rate
    const subtotal = calculateSubtotal(documentData.data.addedProducts);
    const total = applyTaxes(subtotal, taxRate);

    // Map the data according to the quote schema
    const quoteData = {
      userId: documentData.userId,
      company: documentData.data.quoteHeadDetails.company,
      object: documentData.data.quoteHeadDetails.object,
      description: documentData.data.quoteHeadDetails.description,
      commissioner: documentData.data.selectedClient,
      subtotal: subtotal.toFixed(2),
      total: total.toFixed(2),
      notes: null,
      issuedDate: new Date(),
      expiryDate: new Date(new Date().setDate(new Date().getDate() + 30)), // 30 days from now
      pdfUrl: null,
      data: documentData.data,
    };

    const newQuote = await Quote.create(quoteData);

    // Generate PDF
    const pdfBuffer = await generatePDF({
      ...documentData,
      quoteNumber: `${newQuote.id}`,
      company: quoteData.company,
      object: quoteData.object,
      description: quoteData.description,
      taxRate,
      subtotal: quoteData.subtotal,
      total: quoteData.total,
      issuedDate: quoteData.issuedDate,
      expiryDate: quoteData.expiryDate,
      signature: documentData.data.signature,
      date: documentData.data.date,
    });

    const filename = `Preventivo-ID${newQuote.id}-${quoteData.object.replace(
      /\s+/g,
      "_"
    )}-${quoteData.issuedDate.toDateString()}.pdf`;
    const filePath = path.join(process.env.PDF_STORAGE_FOLDER_DIR, filename);

    fs.writeFile(filePath, pdfBuffer, async (err) => {
      if (err) {
        Logger.error(`Failed to write PDF to ${filePath}: ${err.message}`);
        return res.status(500).json({
          message: "Failed to save PDF",
          error: err.message,
        });
      }

      // Update the quote with the PDF URL after the PDF has been saved
      const pdfUrl =
        process.env.NODE_ENV === "production"
          ? `${process.env.BASE_URL}${
              process.env.CUSTOM_HTTP_PORT
                ? ":" + process.env.CUSTOM_HTTP_PORT
                : ""
            }/pdfs/${filename}`
          : `${process.env.BASE_URL}:${process.env.PORT}/pdfs/${filename}`;

      await newQuote.update({ pdfUrl });
      res.status(201).json({
        message: "Quote created and PDF generated and stored successfully!",
        pdfUrl,
        data: newQuote,
      });
    });
  } catch (error) {
    Logger.error(`Error creating quote: ${error.message}`);
    res.status(400).json({ message: "Error processing request", error });
  }
});

router.delete("/delete-quotes", authMiddleware, async (req, res) => {
  const { ids } = req.body;

  if (!Array.isArray(ids) || ids.length === 0) {
    return res
      .status(400)
      .json({ error: "Invalid request, 'ids' must be a non-empty array." });
  }

  try {
    // Fetch the quotes to get their pdfUrl
    const quotes = await Quote.findAll({ where: { id: ids } });

    // Delete the PDF files associated with each quote
    quotes.forEach((quote) => {
      if (quote.pdfUrl) {
        const pdfPath = path.join(
          process.env.PDF_STORAGE_FOLDER_DIR,
          path.basename(quote.pdfUrl)
        );
        if (fs.existsSync(pdfPath)) {
          fs.unlinkSync(pdfPath);
          Logger.info(`Deleted PDF file: ${pdfPath}`);
        } else {
          Logger.warn(`PDF file not found: ${pdfPath}`);
        }
      }
    });

    // Delete the quotes from the database
    const deletedCount = await Quote.destroy({ where: { id: ids } });

    if (deletedCount === 0) {
      return res
        .status(404)
        .json({ error: "No quotes found with the given IDs." });
    }

    res.status(200).json({
      ids,
      message: `${deletedCount} quotes were successfully deleted.`,
    });
  } catch (error) {
    Logger.error("Error deleting quotes:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

export default router;
