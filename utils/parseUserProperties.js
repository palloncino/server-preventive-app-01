export function parseUserProperties(user) {
  // Apparently, when the table cell contain an object {...} this is not necessary, but if it is an array [{...}, ...] then this check is fundamental.
  try {
    if (typeof user.address === 'string') {
      user.address = JSON.parse(user.address);
    }
    return user; 
  } catch (error) {
    Logger.error(`Express app, parseUserProperties: ${error}`);
    console.error("Failed to parse user properties:", error);
  }
}
