export function safelyParseJSON(jsonString) {
  try {
    var parsed = JSON.parse(jsonString);
    // Check if it was double-encoded
    if (typeof parsed === "string") {
      parsed = JSON.parse(parsed);
    }
    return parsed;
  } catch (e) {
    // If error, log it and return the original jsonString or a fallback empty object
    Logger.error(`Failed to parse JSON: ${e}`);
    return {};
  }
}
