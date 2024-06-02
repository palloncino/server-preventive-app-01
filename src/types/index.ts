import { Document } from 'mongoose';
// + - - - - - - - - - - - - -
// | USER
// + - - - - - - - - - - - - -

export interface IUser {
  username: string;
  firstName: string;
  lastName: string;
  companyName: string;
  email: string;
  password: string;
  role: string;
}

export interface IUserDocument extends IUser, Document {
  comparePassword(password: string): Promise<boolean>;
  isModified: (path: string) => boolean;
  _id: any;
}
