import express from 'express';
import { CONNECT_DB, GET_DB, CLOSE_DB } from './config/mongodb.js';
import AsyncExitHook from 'async-exit-hook';
import { env } from './config/environment.js';
import APIs_V1 from './routes/v1/index.js';
import cookieParser from 'cookie-parser';
import helmet from 'helmet';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import initializeDatabase from './scripts/initialDatabase.js';
const __filename = fileURLToPath(import.meta.url);
// const __dirname = path.dirname(__filename);

const allowOrigins = ['http://localhost:5173'];
const app = express();

const START_SERVER = () => {
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
        methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
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