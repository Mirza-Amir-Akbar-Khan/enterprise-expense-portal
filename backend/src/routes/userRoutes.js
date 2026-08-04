import express from 'express';
import {
  getAllUsers,
  syncUser,
  adminCreateUser,
  updateUserRole,
  deleteUser,
} from '../controllers/userController.js';
import { verifyToken } from '../middleware/authMiddleware.js';

const router = express.Router();

// General User routes (Protected by Cognito JWT)
router.get('/users', verifyToken, getAllUsers);
router.post('/users/sync', verifyToken, syncUser);

// Admin User Management routes (Protected by Cognito JWT)
router.post('/admin/users', verifyToken, adminCreateUser);
router.patch('/admin/users/:id/role', verifyToken, updateUserRole);
router.delete('/admin/users/:id', verifyToken, deleteUser);

export default router;
