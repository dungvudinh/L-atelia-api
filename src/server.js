// server.js - CẬP NHẬT TOÀN BỘ FILE NÀY
import express from 'express';
import { CONNECT_DB, GET_DB, CLOSE_DB } from './config/mongodb.js';
import AsyncExitHook from 'async-exit-hook';
import { env } from './config/environment.js';
import APIs_V1 from './routes/v1/index.js';
import cookieParser from 'cookie-parser';
import helmet from 'helmet';
import cors from 'cors';
import initializeDatabase from './scripts/initialDatabase.js';

const allowOrigins = [
  'http://localhost:5173',
  'http://localhost:5174',
  'http://localhost:5175',
  'http://localhost:4173',
  'http://localhost:4174',
  'https://latelia.com',
  'https://admin.latelia.com',
  'http://latelia.com', // Thêm http
  'http://admin.latelia.com', // Thêm http
];

const app = express();



// ✅ CẬP NHẬT Helmet config
app.use(helmet({
  contentSecurityPolicy: false,
  crossOriginEmbedderPolicy: false, // TẮT cái này
  crossOriginResourcePolicy: { policy: "cross-origin" }, // CHO PHÉP cross-origin
}));

app.use(cookieParser());

// ✅ CẬP NHẬT CORS middleware
app.use(cors({
  origin: function (origin, callback) {
    if (!origin) return callback(null, true);

    if (allowOrigins.includes(origin)) return callback(null, true);

    if (/^https?:\/\/([a-zA-Z0-9-]+\.)?latelia\.com$/.test(origin)) {
      return callback(null, true);
    }

    if (/^https?:\/\/([a-zA-Z0-9-]+\.)?admin\.latelia\.com$/.test(origin)) {
      return callback(null, true);
    }

    return callback(new Error(`Origin ${origin} not allowed`));
  },
  credentials: true,
  methods: ['GET','POST','PUT','DELETE','PATCH','OPTIONS'],
  allowedHeaders: [
    'Content-Type',
    'Authorization',
    'X-Requested-With',
    'X-Client-Version',
    'X-Strategy',
    'X-Client',
    'X-Client-Domain'
  ]
}));
;

// ✅ Middleware thêm CORS headers cho mọi response
app.use((req, res, next) => {
  const origin = req.headers.origin;
  
  // Thêm headers cho tất cả responses
  if (origin && allowOrigins.includes(origin)) {
    res.header('Access-Control-Allow-Origin', origin);
  }
  res.header('Access-Control-Allow-Credentials', 'true');
  res.header('Vary', 'Origin'); // Quan trọng cho cache
  
  next();
});

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use('/uploads', express.static('uploads'));
app.use('/v1', APIs_V1);

// Error handler - ĐẢM BẢO CORS headers ngay cả khi error
app.use((err, req, res, next) => {
  console.log('[Error Middleware]', err.message);
  
  // Vẫn thêm CORS headers khi có lỗi
  const origin = req.headers.origin;
  if (origin && allowOrigins.includes(origin)) {
    res.header('Access-Control-Allow-Origin', origin);
    res.header('Access-Control-Allow-Credentials', 'true');
  }
  
  const status = err.statusCode || 500;
  res.status(status).json({
    success: false,
    message: err.message || 'Internal Server Error'
  });
});

const START_SERVER = () => {
  app.listen(env.APP_PORT, '0.0.0.0', () => {
    console.log(`
🚀 Server is running on port: ${env.APP_PORT}
✅ CORS Allowed Origins:
${allowOrigins.map(o => `   - ${o}`).join('\n')}
    `);
  });
  
  AsyncExitHook(() => {
    console.log('Disconnecting from Database');
    CLOSE_DB();
    console.log('Disconnected from Database');
  });
};

(async () => {
  try {
    console.log('Connecting to Database');
    await CONNECT_DB();
    await initializeDatabase();
    console.log('Connected to Database');
    START_SERVER();
  } catch (err) {
    console.error('Database connection failed:', err);
    process.exit(1);
  }
})();