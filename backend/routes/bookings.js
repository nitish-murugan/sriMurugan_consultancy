import express from 'express';
import {
  createBooking,
  getMyBookings,
  getBookingById,
  getAllBookings,
  updateBookingStatus,
  uploadDriverPermit,
  getBookingStats,
  downloadInvoice
} from '../controllers/bookingController.js';
import { protect, adminOnly } from '../middleware/authMiddleware.js';
import { upload } from '../middleware/uploadMiddleware.js';

const router = express.Router();

// All routes require authentication
router.use(protect);

// Client routes
router.post('/', createBooking);
router.get('/my-bookings', getMyBookings);
router.get('/:id/invoice', downloadInvoice);
router.get('/:id', getBookingById);

// Admin routes
router.get('/', adminOnly, getAllBookings);
router.get('/admin/stats', adminOnly, getBookingStats);
router.put('/:id/status', adminOnly, updateBookingStatus);
router.put('/:id/permit', adminOnly, upload.single('permitFile'), uploadDriverPermit);

export default router;
