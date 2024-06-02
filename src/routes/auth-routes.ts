import express, { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import User from '../models/user';
import { IUserDocument } from '../types'; // Ensure the path is correct
import authMiddleware from '../utils/auth-middleware';

const router = express.Router();

router.post('/login', async (req: Request, res: Response) => {
  const { email, password } = req.body;

  try {
    const user = await User.findOne({ email }) as IUserDocument | null;

    if (!user) {
      return res.status(401).json({ message: 'Invalid email or password, there is no user with that email' });
    }

    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid email or password, the credentials do not match' });
    }

    const token = jwt.sign(
      { id: user._id, email: user.email, role: user.role },
      process.env.SECRET_KEY as string,
      { expiresIn: '1h' }
    );

    res.status(200).json({ message: 'Authentication successful!', token, user });
  } catch (error) {
    console.error('Error during login:', error);
    res.status(500).json({ message: 'Error during login', error: (error as Error).message });
  }
});

router.post('/verify-token', async (req: Request, res: Response) => {
  const { token } = req.body;
  if (!token) {
    return res.status(400).json({ message: 'Token is required' });
  }
  try {
    const decoded = jwt.verify(token, process.env.SECRET_KEY as string) as any;
    const user = await User.findById(decoded.id) as IUserDocument | null;
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    res.json({ message: 'Token verified successfully', user });
  } catch (error) {
    res.status(401).json({ message: 'Invalid or expired token', error: (error as Error).message });
  }
});

router.post('/signup', async (req: Request, res: Response) => {
  const { username, firstName, lastName, companyName, email, password } = req.body;

  try {
    const existingUser = await User.findOne({ email }) as IUserDocument | null;
    if (existingUser) {
      return res.status(409).json({ message: 'User already exists with the same email' });
    }

    // Create the new user
    const newUser = new User({
      username,
      firstName,
      lastName,
      companyName,
      email,
      password, // Pass the password directly, it will be hashed by the model hook
      role: 'user',
    }) as IUserDocument;

    await newUser.save();

    res.status(201).json({ message: 'User registered successfully!', user: newUser });
  } catch (error) {
    res.status(500).json({ message: 'Error registering user: ' + (error as Error).message });
  }
});

export default router;
