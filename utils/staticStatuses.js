export const STATUSES = {
  DOCUMENT_OPENED: "DOCUMENT_OPENED",
  EMAIL_OTP: "EMAIL_OTP",
  CLIENT_SIGNATURE: "CLIENT_SIGNATURE",
  STORAGE_CONFIRMATION: "STORAGE_CONFIRMATION",
  EXPIRED: "EXPIRED",
  REJECTED: "REJECTED",
};

export const initialStatus = [
  { name: STATUSES.DOCUMENT_OPENED, value: false },
  { name: STATUSES.EMAIL_OTP, value: false },
  { name: STATUSES.CLIENT_SIGNATURE, value: false },
  { name: STATUSES.STORAGE_CONFIRMATION, value: false },
  { name: STATUSES.EXPIRED, value: false },
  { name: STATUSES.REJECTED, value: false },
];

export const createdDocumentStatus = [
  { name: STATUSES.DOCUMENT_OPENED, value: true },
  { name: STATUSES.EMAIL_OTP, value: true },
  { name: STATUSES.CLIENT_SIGNATURE, value: false },
  { name: STATUSES.STORAGE_CONFIRMATION, value: false },
  { name: STATUSES.EXPIRED, value: false },
  { name: STATUSES.REJECTED, value: false },
];
