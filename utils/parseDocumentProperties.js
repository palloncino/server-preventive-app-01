import Logger from "../utils/Logger.js";

export function parseDocumentDataProperties(data) {
  try {
    if (typeof data === "string") data = JSON.parse(data);
    if (typeof data.addedProducts === "string")
      data.addedProducts = JSON.parse(data.addedProducts);

    if (Array.isArray(data.addedProducts)) {
      data.addedProducts = data.addedProducts.map((product) => {
        if (typeof product.components === "string")
          product.components = JSON.parse(product.components);

        if (Array.isArray(product.components)) {
          product.components = product.components.map((component) => {
            if (typeof component.documentation === "string")
              component.documentation = JSON.parse(component.documentation);
            return component;
          });
        }

        if (typeof product.documentation === "string")
          product.documentation = JSON.parse(product.documentation);

        return product;
      });
    }

    if (typeof data.quoteHeadDetails === "string")
      data.quoteHeadDetails = JSON.parse(data.quoteHeadDetails);

    if (typeof data.selectedClient === "string")
      data.selectedClient = JSON.parse(data.selectedClient);

    return data;
  } catch (error) {
    Logger.error(`Failed to parse document data properties: ${error}`);
    return data;
  }
}

export function parseDocumentProperties(document) {
  try {
    if (typeof document === "string") document = JSON.parse(document);
    if (typeof document.status === "string")
      document.status = JSON.parse(document.status);
    if (typeof document.history === "string")
      document.history = JSON.parse(document.history);
    if (typeof document.followUpSent === "string")
      document.followUpSent = JSON.parse(document.followUpSent);
    if (typeof document.uploadedFiles === "string")
      document.uploadedFiles = JSON.parse(document.uploadedFiles);

    document.data = parseDocumentDataProperties(document.data);
    return document;
  } catch (error) {
    Logger.error(`Failed to parse document properties: ${error}`);
    return document;
  }
}

export function safeParseJSON(input) {
  try {
    if (typeof input === "string") {
      let parsed = JSON.parse(input);
      while (typeof parsed === "string") parsed = JSON.parse(parsed);
      return parsed;
    }
    return input;
  } catch (error) {
    Logger.error(`Failed to parse JSON: ${error}`);
    return input;
  }
}
