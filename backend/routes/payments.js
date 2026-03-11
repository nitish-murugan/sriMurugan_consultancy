import express from 'express';
import {
  createOrder,
  verifyPayment,
  getPaymentDetails,
  getRazorpayKey,
  initiateRefund
} from '../controllers/paymentController.js';
import { protect, adminOnly } from '../middleware/authMiddleware.js';

const router = express.Router();

// Public route for key
router.get('/key', getRazorpayKey);

// Protected routes
router.use(protect);
router.post('/create-order', createOrder);
router.post('/verify', verifyPayment);

// Admin routes
router.get('/:paymentId', adminOnly, getPaymentDetails);
router.post('/:paymentId/refund', adminOnly, initiateRefund);

export default router;
