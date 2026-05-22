import express from 'express';
import { User } from '../models/index.js';
import { authMiddleware } from '../middleware/auth.js';

const router = express.Router();

// Get all users - Auth required
router.get('/', authMiddleware, async (req, res) => {
  try {
    const users = await User.find({}, 'name email role');
    return res.json(users);
  } catch (error) {
    return res.status(500).json({ message: 'Error retrieving users', error: error.message });
  }
});

export default router;
