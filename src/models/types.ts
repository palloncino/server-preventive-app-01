// + - - - - - - - - - - - -
// | User
// + - - - - - - - - - - - -
export interface UserType {
  id: number;
  username: string;
  firstName: string;
  lastName: string;
  companyName: "sermixer" | "s2_truck_service";
  email: string;
  role: string;
  password: string;
  createdAt: string;
  updatedAt: string;
}

// + - - - - - - - - - - - -
// | Client
// + - - - - - - - - - - - -
interface Address {
  street: string;
  city: string;
  zipCode: string;
  country: string;
}
interface ClientType {
  id: number;
  fiscalCode: string;
  vatNumber: string;
  firstName: string;
  lastName: string;
  companyName: string;
  address: Address;
  email: string;
  phoneNumber?: string;
  mobileNumber?: string;
  contactPerson: string;
  status: string;
  role: string;
  password: string;
  createdAt: string;
  updatedAt: string;
}

interface Documentation {
  name: string;
  url: string;
}

interface Component {
  name: string;
  description: string;
  documentation: Documentation[];
  price: number;
  optional?: boolean;
}

// + - - - - - - - - - - - -
// | Product
// + - - - - - - - - - - - -
interface ProductType {
  id: number;
  name: string;
  description: string;
  price: string;
  category: string;
  imgUrl: string;
  components: Component;
  documentation: Documentation[];
  createdAt: string;
  updatedAt: string;
}

export type QuoteHeadDetailsType = {
  company: string;
  description: string;
  object: string;
};

export interface DocumentType {
  addedProducts: ProductType[];
  quoteHeadDetails: QuoteHeadDetailsType;
  selectedClient: ClientType;
}

export type FollowUpSentType = {
  immediate: boolean;
  reminder: boolean;
  expiration: boolean;
};

export type DocumentHistoryType = {
  action: string;
  timestamp: string;
  details?: string;
};

export type DocumentDataDataType = {
  selectedClient: ClientType | null;
  quoteHeadDetails: QuoteHeadDetailsType | null;
  addedProducts: ProductType[] | null;
};

type StatusName = 
  | "DOCUMENT_OPENED"
  | "EMAIL_OTP"
  | "CLIENT_SIGNATURE"
  | "STORAGE_CONFIRMATION"
  | "EXPIRED"
  | "REJECTED";

type StatusStep = {
  name: StatusName;
  value: boolean;
};

export type DocumentDataType = {
  id: string;
  hash: string;
  data: DocumentDataDataType;
  createdAt: string;
  updatedAt: string;
  expiresAt: string | null;
  status: StatusStep[];
  signedAt: string | null;
  signature: string | null;
  userId: string;
  clientEmail: string;
  otp: string;
  readonly: boolean;
  followUpSent: FollowUpSentType;
  history: DocumentHistoryType[] | null;
  note: string | null; // new addition
};

// + - - - - - - - - - - - -
// | Client Document Page Related
// + - - - - - - - - - - - -
export interface DocumentFooterProps {
  onSaveSignature: (signature: string, date: string) => void;
  initialDate?: string;
  initialSignature?: string;
}