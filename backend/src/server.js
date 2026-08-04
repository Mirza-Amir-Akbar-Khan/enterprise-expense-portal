import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import healthRoutes from './routes/healthRoutes.js';
import claimRoutes from './routes/claimRoutes.js';
import userRoutes from './routes/userRoutes.js';
import lookupRoutes from './routes/lookupRoutes.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());


// Routes
app.use('/api', healthRoutes);
app.use('/api', claimRoutes);
app.use('/api', userRoutes);
app.use('/api/lookups', lookupRoutes);

// Root Route
app.get('/', (req, res) => {
  res.send('Expense & Claim Management API Server is running');
});

// Start Server
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
