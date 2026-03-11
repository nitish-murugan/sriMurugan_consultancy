import express from 'express';
import {
  getDashboardStats,
  getAllUsers,
  updateUserStatus,
  searchRestaurants,
  createAdminUser
} from '../controllers/adminController.js';
import { protect, adminOnly } from '../middleware/authMiddleware.js';

const router = express.Router();

// Create first admin (should be disabled in production)
router.post('/create-admin', createAdminUser);

// All other routes require admin access
router.use(protect, adminOnly);

router.get('/dashboard', getDashboardStats);
router.get('/users', getAllUsers);
router.put('/users/:id', updateUserStatus);
router.post('/restaurants/search', searchRestaurants);

export default router;
