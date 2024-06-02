export const formatDateToISOString = (date) => {
  const isoRegex = /^\d{4}-\d{2}-\d{2}$/;
  if (isoRegex.test(date)) {
    return date;
  }
  const parsedDate = new Date(date);
  const pad = (n) => (n < 10 ? '0' + n : n);
  return `${parsedDate.getUTCFullYear()}-${pad(parsedDate.getUTCMonth() + 1)}-${pad(parsedDate.getUTCDate())}`;
};