import express from 'express';
import {
  getCompanies,
  searchCompanies,
  getCompanyById,
  createCompany,
  updateCompany,
  deleteCompany,
  getDomains,
  getAISuggestions
} from '../controllers/companyController.js';
import { protect, adminOnly } from '../middleware/authMiddleware.js';

const router = express.Router();

// Public routes
router.get('/domains', getDomains);
router.get('/', getCompanies);
router.post('/search', searchCompanies);
router.get('/:id', getCompanyById);

// Protected routes
router.post('/ai-suggest', protect, getAISuggestions);

// Admin routes
router.use(protect, adminOnly);
router.post('/', createCompany);
router.put('/:id', updateCompany);
router.delete('/:id', deleteCompany);

export default router;
