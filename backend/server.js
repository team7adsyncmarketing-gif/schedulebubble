import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import dotenv from 'dotenv';
import cookieParser from 'cookie-parser';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables immediately
dotenv.config({ path: path.join(__dirname, '.env') });

import authRoutes from './routes/authRoutes.js';
import oauthRoutes from './routes/oauthRoutes.js';
import postRoutes from './routes/postRoutes.js';
import analyticsRoutes from './routes/analyticsRoutes.js';
import aiRoutes from './routes/aiRoutes.js';
import mediaRoutes from './routes/mediaRoutes.js';
import userRoutes from './routes/userRoutes.js';
import { startPublisherService } from './services/publisherService.js';
import { startInsightsService } from './services/insightsService.js';

import dns from 'dns';
dns.setServers(['8.8.8.8', '1.1.1.1']); // Forces Google & Cloudflare public DNS to bypass local network block

const app = express();

// Middleware
app.use(cors({ origin: 'http://localhost:5173', credentials: true }));
app.use(express.json());
app.use(cookieParser());

// Static file serving for uploads
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/oauth', oauthRoutes);
app.use('/api/posts', postRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/ai', aiRoutes);
app.use('/api/media', mediaRoutes);

// Database Connection
const connectDB = async () => {
  try {
    if (!process.env.DATABASE_URL) {
      console.warn("WARNING: No DATABASE_URL found in .env. Skipping MongoDB connection for now.");
      return;
    }
    const conn = await mongoose.connect(process.env.DATABASE_URL);
    console.log(`MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    console.error(`Error connecting to MongoDB: ${error.message}`);
    process.exit(1);
  }
};

// Start Server
const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  connectDB();
  console.log(`Server running on port ${PORT}`);
  startPublisherService();
  startInsightsService();
});
