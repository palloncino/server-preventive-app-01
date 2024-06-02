import crypto from "crypto";
import dotenv from "dotenv";
import express from "express";
import fs from "fs";
import multer from "multer";
import path from "path";
import { v4 as uuidv4 } from "uuid";
import Document from "../models/document.js";
import Logger from "../utils/Logger.js";
import { generateChangeLogs } from "../utils/changeLogs.js";
import { sendEmail } from "../utils/emailManager.js";
import authMiddleware from "../utils/authMiddleware.js";
import {
  parseDocumentProperties,
  safeParseJSON,
} from "../utils/parseDocumentProperties.js";
import {
  createdFollowUpState,
  initFollowUpState,
} from "../utils/staticFollowUp.js";
import { STATUSES, createdDocumentStatus } from "../utils/staticStatuses.js";

dotenv.config({
  path: process.env.NODE_ENV === "production" ? ".env.remote" : ".env.local",
});

const router = express.Router();

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, process.env.PDF_STORAGE_FOLDER_DIR);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = `${Date.now()}-${crypto
      .randomBytes(4)
      .toString("hex")}`;
    cb(null, `preventive_docs-${uniqueSuffix}-${file.originalname}`);
  },
});

const upload = multer({ storage });

const handleFileDeletion = (filePath) => {
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
};

router.post("/create-document", authMiddleware, async (req, res) => {
  try {
    const { quoteHeadDetails, selectedClient, addedProducts, note, userId } =
      req.body;
    const hash = uuidv4();
    const otp = crypto.randomBytes(4).toString("hex");
    const now = new Date();
    const expiresAt = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

    const newDocument = await Document.create({
      hash,
      data: { quoteHeadDetails, selectedClient, addedProducts },
      createdAt: now,
      updatedAt: now,
      expiresAt,
      signedAt: null,
      signature: null,
      otp,
      userId,
      clientEmail: selectedClient.email,
      status: createdDocumentStatus,
      followUpSent: initFollowUpState,
      history: [],
      readonly: false,
      note,
    });

    const emailSubject = "Your document has been created";
    const emailText = `Dear ${selectedClient.name},\n\nYour document has been created. Please find the details below:\n\nHash: ${hash}\n\nOTP: ${otp}`;
    const emailHtml = `<p>Dear ${selectedClient.name},</p><p>Your document has been created. Please find the details below:</p><p><strong>Hash:</strong> ${hash}</p><p><strong>OTP:</strong> ${otp}</p>`;
    await sendEmail(selectedClient.email, emailSubject, emailText, emailHtml);

    await Document.update(
      { followUpSent: createdFollowUpState },
      { where: { hash } }
    );

    res.status(201).json({ newDocument });
  } catch (error) {
    Logger.error("Error creating document:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

router.get("/get-all-documents", authMiddleware, async (req, res) => {
  try {
    const documents = await Document.findAll();
    if (documents) {
      const parsedDocuments = documents.map(parseDocumentProperties);
      res.json(parsedDocuments);
    } else {
      res.status(404).json({ error: "Documents not found" });
    }
  } catch (error) {
    Logger.error("Error fetching documents:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

router.get("/get-document/:hash", async (req, res) => {
  try {
    const { hash } = req.params;
    const document = await Document.findOne({ where: { hash } });
    if (document) {
      const parsedDocument = parseDocumentProperties(document);
      res.json(parsedDocument);
    } else {
      res.status(404).json({ error: "Document not found" });
    }
  } catch (error) {
    Logger.error("Error fetching document:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

router.delete("/delete-documents", authMiddleware, async (req, res) => {
  const { ids } = req.body;

  if (!Array.isArray(ids) || ids.length === 0) {
    return res
      .status(400)
      .json({ error: "Invalid request, 'ids' must be a non-empty array." });
  }

  try {
    const documents = await Document.findAll({ where: { id: ids } });

    documents.forEach((document) => {
      const uploadedFiles = document.data.uploadedFiles || [];
      uploadedFiles.forEach((file) => {
        handleFileDeletion(
          path.join(process.env.PDF_STORAGE_FOLDER_DIR, path.basename(file.url))
        );
      });
    });

    const deletedCount = await Document.destroy({ where: { id: ids } });

    if (deletedCount === 0) {
      return res
        .status(404)
        .json({ error: "No documents found with the given IDs." });
    }

    res.status(200).json({
      ids,
      message: `${deletedCount} documents were successfully deleted.`,
    });
  } catch (error) {
    Logger.error("Error deleting documents:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

router.post(
  "/save-document/:hash",
  upload.array("pdfFiles", 5),
  async (req, res) => {
    try {
      const { hash } = req.params;
      const {
        data,
        clientSignature,
        ownerSignature,
        signedAt,
        readonly,
        note,
        status: newStatus,
        uploadedFiles,
      } = JSON.parse(req.body.data);

      Logger.info(`Processing document with hash: ${hash}`);

      const document = await Document.findOne({ where: { hash } });
      if (!document) {
        Logger.error(`Document with hash ${hash} not found.`);
        return res.status(404).json({ error: "Document not found" });
      }

      const now = new Date();
      const oldDocument = parseDocumentProperties({ ...document.toJSON() });
      const currentData = safeParseJSON(document.data);
      const newData = safeParseJSON(data);

      document.data = { ...currentData, ...newData };
      document.signedAt = signedAt !== "" ? signedAt : null;
      document.clientSignature = clientSignature;
      document.ownerSignature = ownerSignature;
      document.readonly = readonly;
      document.note = note;
      document.updatedAt = now;

      let documentStatus = Array.isArray(document.status)
        ? document.status
        : safeParseJSON(document.status);

      const clientSignatureStatus = documentStatus.find(
        (s) => s.name === STATUSES.CLIENT_SIGNATURE
      );
      if (clientSignatureStatus) {
        clientSignatureStatus.value = !!clientSignature;
      }

      if (newStatus) {
        newStatus.forEach((newStatusItem) => {
          const existingStatusItem = documentStatus.find(
            (s) => s.name === newStatusItem.name
          );
          if (
            existingStatusItem &&
            newStatusItem.name !== STATUSES.CLIENT_SIGNATURE
          ) {
            existingStatusItem.value = newStatusItem.value;
          }
        });
        if (
          newStatus.some(
            (s) => s.name === STATUSES.REJECTED && s.value === true
          )
        ) {
          document.readonly = true;
        }
      }

      document.status = documentStatus;

      document.uploadedFiles = Array.isArray(document.uploadedFiles)
        ? document.uploadedFiles
        : [];

      if (req.files && req.files.length > 0) {
        Logger.info(`Received ${req.files.length} file(s).`);
        const uploadedFilesFromClient = req.files.map((file) => ({
          name: file.originalname,
          url: `${process.env.BASE_URL}/pdfs/${file.filename}`,
        }));

        document.uploadedFiles.push(...uploadedFilesFromClient);
        Logger.info(
          `Uploaded files: ${JSON.stringify(uploadedFilesFromClient)}`
        );
        Logger.info(
          `Updated document.uploadedFiles: ${JSON.stringify(
            document.uploadedFiles
          )}`
        );
      } else {
        Logger.info("No files were uploaded.");
      }

      const updatedUploadedFiles = document.uploadedFiles
        .map((file) => {
          const clientFile = uploadedFiles.find((f) => f.name === file.name);
          return {
            ...file,
            url: clientFile ? file.url : file.url,
          };
        })
        .filter((file) => file.url);

      document.uploadedFiles.forEach((file) => {
        if (!file.url) {
          handleFileDeletion(
            path.join(
              process.env.PDF_STORAGE_FOLDER_DIR,
              path.basename(file.url)
            )
          );
        }
      });

      document.uploadedFiles = updatedUploadedFiles;

      let history = Array.isArray(document.history) ? document.history : [];
      if (typeof document.history === "string") {
        history = JSON.parse(document.history);
      }

      const newDocument = parseDocumentProperties({ ...document.toJSON() });
      const changeLogs = generateChangeLogs(oldDocument, newDocument, now);

      history = [...history, ...changeLogs];
      document.history = history;

      await document.save();

      const savedDocument = await Document.findOne({ where: { hash } });

      Logger.info(`Document saved successfully with hash: ${hash}`);

      res.json({ success: true, document: savedDocument });
    } catch (error) {
      Logger.error("Error saving document:", error);
      res.status(500).json({ error: error.message });
    }
  }
);

export default router;
