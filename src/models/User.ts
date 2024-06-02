import mongoose, { Document, Schema } from 'mongoose';
import bcrypt from 'bcryptjs';

interface IUser extends Document {
  username: string;
  firstName: string;
  lastName: string;
  companyName: string;
  email: string;
  password: string;
  role: string;
}

const userSchema: Schema = new Schema<IUser>({
  username: { type: String, required: true },
  firstName: { type: String, required: true },
  lastName: { type: String, required: true },
  companyName: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  role: { type: String, required: true, default: 'user' },
});

// Hash the password before saving the user model
userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) {
    return next();
  }
  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (err) {
    next(err);
  }
});

const User = mongoose.model<IUser>('User', userSchema);
export default User;
