import express from 'express';
import { getLookups } from '../controllers/lookupController.js';

const router = express.Router();

router.get('/', getLookups);

export default router;
