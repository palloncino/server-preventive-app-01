import { IUserDocument } from "../types"; // Adjust the import path as necessary

declare module "xss-clean";
declare module "express-serve-static-core" {
  interface Request {
    user?: IUserDocument;
  }
}
