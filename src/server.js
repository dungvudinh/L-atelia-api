// server.js
import express from 'express';
import cookieParser from 'cookie-parser';
import helmet from 'helmet';
import cors from 'cors';
import AsyncExitHook from 'async-exit-hook';

import { CONNECT_DB, CLOSE_DB } from './config/mongodb.js';
import { env } from './config/environment.js';
import APIs_V1 from './routes/v1/index.js';
import initializeDatabase from './scripts/initialDatabase.js';

const app = express();

/* ==================== ALLOWED ORIGINS ==================== */
const ALLOWED_ORIGINS = [
  'http://localhost:5173',
  'http://localhost:5174',
  'http://localhost:5175',
  'https://admin.latelia.com',
  'https://latelia.com'
];

/* ==================== SECURITY ==================== */
app.use(helmet({
  contentSecurityPolicy: false,
  crossOriginEmbedderPolicy: false,
  crossOriginResourcePolicy: { policy: 'cross-origin' }
}));

app.use(cookieParser());

/* ==================== CORS (🔥 QUAN TRỌNG NHẤT) ==================== */
app.use(cors({
  origin: (origin, callback) => {
    // Cho phép server-to-server / curl
    if (!origin) return callback(null, true);

    if (ALLOWED_ORIGINS.includes(origin)) {
      return callback(null, origin);
    }

    console.error('❌ CORS blocked origin:', origin);
    return callback(new Error('Not allowed by CORS'));
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: '*'
}));

/* ==================== PREFLIGHT SAFE HANDLER ==================== */
// ❗ KHÔNG dùng app.options()
// ❗ Cách này tương thích Node 23 + Express mới
app.use((req, res, next) => {
  if (req.method === 'OPTIONS') {
    return res.sendStatus(204);
  }
  next();
});

/* ==================== BODY PARSER ==================== */
app.use(express.json({ limit: '20mb' }));
app.use(express.urlencoded({ extended: true }));

/* ==================== ROUTES ==================== */
app.use('/v1', APIs_V1);

/* ==================== ERROR HANDLER (GIỮ CORS HEADER) ==================== */
app.use((err, req, res, next) => {
  console.error('[ERROR]', err.message);

  const origin = req.headers.origin;
  if (origin && ALLOWED_ORIGINS.includes(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin);
    res.setHeader('Access-Control-Allow-Credentials', 'true');
  }

  res.status(500).json({
    success: false,
    message: err.message || 'Internal Server Error'
  });
});

/* ==================== START SERVER ==================== */
const START_SERVER = async () => {
  try {
    await CONNECT_DB();
    await initializeDatabase();

    app.listen(env.APP_PORT, '0.0.0.0', () => {
      console.log(`🚀 Server running on port ${env.APP_PORT}`);
      console.log('✅ Allowed origins:');
      ALLOWED_ORIGINS.forEach(o => console.log('  -', o));
    });

    AsyncExitHook(async () => {
      await CLOSE_DB();
      console.log('🛑 DB disconnected');
    });

  } catch (err) {
    console.error('❌ Server start failed:', err);
    process.exit(1);
  }
};

START_SERVER();
