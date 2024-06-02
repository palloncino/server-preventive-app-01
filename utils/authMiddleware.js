import jwt from 'jsonwebtoken';
import User from '../models/user.js'; // Adjust the import to your Sequelize User model

const authMiddleware = async (req, res, next) => {
  const token = req.headers['authorization']?.split(' ')[1];

  if (!token) {
    return res.status(403).json({ message: 'No token provided' });
  }

  try {
    const decoded = jwt.verify(token, process.env.SECRET_KEY);
    const user = await User.findByPk(decoded.id);

    if (!user) {
      return res.status(403).json({ message: 'User not found' });
    }

    // Attach the user object to the request
    req.user = user;
    next();
  } catch (error) {
    return res.status(403).json({ message: 'Failed to authenticate token' });
  }
};

export default authMiddleware;
