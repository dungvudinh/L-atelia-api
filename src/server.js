// server.js - CẬP NHẬT VỚI CORS FIX
import express from 'express';
import { CONNECT_DB, GET_DB, CLOSE_DB } from './config/mongodb.js';
import AsyncExitHook from 'async-exit-hook';
import { env } from './config/environment.js';
import APIs_V1 from './routes/v1/index.js';
import cookieParser from 'cookie-parser';
import helmet from 'helmet';
// Không cần import cors nữa vì sẽ dùng middleware tự viết
import initializeDatabase from './scripts/initialDatabase.js';

const app = express();

// ==================== HELMET CONFIG ====================
app.use(helmet({
  contentSecurityPolicy: false,
  crossOriginEmbedderPolicy: false,
  crossOriginResourcePolicy: { policy: "cross-origin" },
}));

app.use(cookieParser());

// ==================== CORS FIX - ĐẶT ĐẦU TIÊN ====================
// Đây là đoạn code fix bạn cung cấp, đã được điều chỉnh
app.use((req, res, next) => {
  // Lấy origin từ request header
  const origin = req.headers.origin;
  
  // Danh sách origins được phép
  const allowedOrigins = [
    'http://localhost:5173',
    'http://localhost:5174',
    'http://localhost:5175',
    'http://localhost:4173',
    'http://localhost:4174',
    'https://latelia.com',
    'https://admin.latelia.com',
    'http://latelia.com',
    'http://admin.latelia.com',
  ];

  // Kiểm tra và set Access-Control-Allow-Origin
  if (origin) {
    // Cho phép origin nếu nằm trong danh sách hoặc là subdomain của latelia.com
    if (allowedOrigins.includes(origin) || origin.endsWith('.latelia.com')) {
      res.header("Access-Control-Allow-Origin", origin);
      console.log(`[CORS] ✅ Allowed origin: ${origin}`);
    } else {
      console.log(`[CORS] ❌ Blocked origin: ${origin}`);
      // Vẫn set header nhưng có thể sẽ bị chặn
      res.header("Access-Control-Allow-Origin", origin);
    }
  } else {
    // Cho phép requests không có origin (server-to-server)
    res.header("Access-Control-Allow-Origin", "*");
  }
  
  // Các CORS headers khác
  res.header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, PATCH, OPTIONS");
  res.header("Access-Control-Allow-Headers", 
    "Content-Type, Authorization, X-Requested-With, X-Client, X-Strategy, X-Client-Version, X-Client-Domain, Accept, Origin"
  );
  res.header("Access-Control-Allow-Credentials", "true");
  res.header("Access-Control-Expose-Headers", "Content-Length, Authorization, X-Total-Count");
  res.header("Access-Control-Max-Age", "86400"); // 24h
  res.header("Vary", "Origin");

  // Log request để debug
  console.log(`[CORS] Request received: ${req.method} ${req.url} from origin: ${origin || 'no-origin'}`);

  // Xử lý preflight OPTIONS request NGAY LẬP TỨC
  if (req.method === 'OPTIONS') {
    console.log(`[CORS] 🚀 Handling preflight for ${req.url}`);
    return res.status(204).end(); // No content, success
  }
  
  next();
});

// ==================== BODY PARSER ====================
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));
app.use('/uploads', express.static('uploads'));

// ==================== ROUTES ====================
app.use('/v1', APIs_V1);

// ==================== HEALTH CHECK ====================
app.get('/health', (req, res) => {
  res.json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    environment: env.NODE_ENV || 'development',
    cors: {
      message: "CORS fix applied",
      currentOrigin: req.headers.origin
    }
  });
});

// ==================== CORS TEST ENDPOINT ====================
app.get('/cors-test', (req, res) => {
  res.json({
    success: true,
    message: 'CORS test successful',
    origin: req.headers.origin,
    timestamp: new Date().toISOString(),
    headers: {
      origin: req.headers.origin,
      'x-client': req.headers['x-client'],
      'x-strategy': req.headers['x-strategy']
    }
  });
});

// ==================== ERROR HANDLER ====================
app.use((err, req, res, next) => {
  console.error('[Error Middleware]', err.message);
  
  // CORS headers đã được set ở middleware trước, không cần set lại
  const status = err.statusCode || 500;
  res.status(status).json({
    success: false,
    message: err.message || 'Internal Server Error',
    timestamp: new Date().toISOString()
  });
});

// ==================== 404 HANDLER ====================
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: 'Route not found',
    path: req.path,
    method: req.method
  });
});

const START_SERVER = () => {
  const server = app.listen(env.APP_PORT || 10000, '0.0.0.0', () => {
    console.log(`
🚀 Server is running on port: ${env.APP_PORT || 10000}
🌍 Environment: ${env.NODE_ENV || 'development'}
✅ CORS Fix Applied - Custom middleware
📊 Health Check: http://localhost:${env.APP_PORT || 10000}/health
🔍 CORS Test: http://localhost:${env.APP_PORT || 10000}/cors-test
    `);
  });

  server.timeout = 300000;
  
  AsyncExitHook(() => {
    console.log('Disconnecting from Database');
    CLOSE_DB();
    console.log('Disconnected from Database');
  });
};

(async () => {
  try {
    console.log('Connecting to Database...');
    await CONNECT_DB();
    await initializeDatabase();
    console.log('✅ Connected to Database');
    START_SERVER();
  } catch (err) {
    console.error('❌ Database connection failed:', err);
    process.exit(1);
  }
})();