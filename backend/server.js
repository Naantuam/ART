import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import auctionRoutes from './routes/auctionRoutes.js';
import uploadRoutes from './routes/uploadRoutes.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

// Routes
app.use('/api/auctions', auctionRoutes);
app.use('/api/upload', uploadRoutes);

// Basic health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'Backend is running' });
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
