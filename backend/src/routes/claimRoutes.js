import express from 'express';
import {
  getAllClaims,
  getClaimById,
  createClaim,
  updateClaimStatus,
  getClaimStats,
  deleteClaim,
} from '../controllers/claimController.js';
import { verifyToken, optionalVerifyToken } from '../middleware/authMiddleware.js';

const router = express.Router();

// Read routes (Allows preview mode if unauthenticated, attaches req.user if token provided)
router.get('/claims', optionalVerifyToken, getAllClaims);
router.get('/claims/stats', optionalVerifyToken, getClaimStats);
router.get('/claims/:id', optionalVerifyToken, getClaimById);

// Write / Modify routes (Strictly protected by Cognito JWT)
router.post('/claims', verifyToken, createClaim);
router.patch('/claims/:id/status', verifyToken, updateClaimStatus);
router.delete('/claims/:id', verifyToken, deleteClaim);

export default router;
