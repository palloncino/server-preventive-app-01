import { IUserDocument } from "../types"; // Adjust the import path as necessary

declare module "xss-clean";
declare global {
  namespace Express {
    interface Request {
      user?: IUserDocument;
    }
  }
}
