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
  'https://s3.us-east-005.backblazeb2.com',
  'https://s3.us-east-005.backblazeb2.com'
];
const app = express();

const START_SERVER = () => {
        // Thay thế app.options('/*', ...) bằng:
app.options(/.*/, (req, res) => {
    const origin = req.headers.origin;
    
    console.log('OPTIONS Request for:', {
        origin: origin,
        url: req.url,
        method: req.method,
        'access-control-request-method': req.headers['access-control-request-method'],
        'access-control-request-headers': req.headers['access-control-request-headers']
    });
    
    if (!origin || allowOrigins.includes(origin)) {
        res.header('Access-Control-Allow-Origin', origin);
        res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, PATCH, OPTIONS');
        res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With');
        res.header('Access-Control-Allow-Credentials', 'true');
        res.header('Access-Control-Max-Age', '86400');
        
        console.log('OPTIONS Allowed for origin:', origin);
        return res.status(200).send();
    } else {
        console.log('OPTIONS Blocked for origin:', origin);
        return res.status(403).json({
            success: false,
            message: 'CORS not allowed'
        });
    }
});
    app.use(helmet({
        contentSecurityPolicy: false,
    }));
    app.use(cookieParser());
    app.use(cors({
        origin: function(origin, callback){
            if (!origin || allowOrigins.includes(origin)) {
                callback(null, true);
            } else {
                callback(new Error("Not allowed by CORS"));
            }
        },
        credentials: true,
        methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH','OPTIONS'],
        allowedHeaders: ['Content-Type', 'Authorization'], 
    }));
    app.use(express.json());
    app.use(express.urlencoded({ extended: true }));
    
    // NEW: Serve static files from uploads directory
    app.use('/uploads', express.static('uploads'));
    
    app.use('/v1', APIs_V1);
    
    // UPDATED: Enhanced error handling middleware
    app.use((err, req, res, next) => {
        const status = err.statusCode || 500;
        const message = err.message || 'Internal Server Error';
        console.log('[Error Middleware]', err);
        
        // NEW: Handle specific error types
        if (err.name === 'ValidationError') {
            return res.status(400).json({
                success: false,
                message: 'Validation Error',
                errors: err.details ? err.details.map(detail => detail.message) : [err.message]
            });
        }
        
        if (err.name === 'CastError') {
            return res.status(400).json({
                success: false,
                message: 'Invalid ID format'
            });
        }
        
        // NEW: Multer file upload errors
        if (err.code === 'LIMIT_FILE_SIZE') {
            return res.status(400).json({
                success: false,
                message: 'File too large'
            });
        }
        
        if (err.code === 'LIMIT_UNEXPECTED_FILE') {
            return res.status(400).json({
                success: false,
                message: 'Unexpected file field'
            });
        }
        
        res.status(status).json({
            success: false,
            message: message
        });
    });
    
    // NEW: 404 handler for undefined routes
    // app.all('*', (req, res) => {
    //     res.status(404).json({
    //         success: false,
    //         message: 'Route not found'
    //     });
    // });

    app.listen(env.APP_PORT, '0.0.0.0', () => {
        console.log(`Server is running on port: ${env.APP_PORT}`);
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