import express from 'express'
import { CONNECT_DB, GET_DB, CLOSE_DB } from './config/mongodb.js'
import AsyncExitHook from 'async-exit-hook'
import {env} from './config/environment.js'
import  APIs_V1  from './routes/v1/index.js'
import cors from 'cors'
import path from 'path'
import cookieParser from 'cookie-parser'
const app = express()
const allowOrigins = [env.PROD_FRONT_URL,env.DEV_FRONT_URL,'https://admin.lacvietstudio.store', 'http://localhost:5174']

const START_SERVER = () => {
    // 1. Parse body before any route
    app.use(cookieParser())
    app.use(cors({
        origin: true,
        // origin: function(origin, callback){
        //     if (!origin || allowOrigins.includes(origin)) {
        //         callback(null, true);
        //       } else {
        //         callback(new Error("Not allowed by CORS"));
        //       }
        // },
        credentials: true,               // Cho phép gửi cookie, authorization header, etc.
        methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'], // Allow OPTIONS
        allowedHeaders: ['Content-Type', 'Authorization'], 
      }));
    app.use(express.static(path.join(__dirname, 'build', 'src')))
    app.use(express.json())
    app.use(express.urlencoded({ extended: true }))

    // 2. Then use your routes
    app.get('/v1', ()=>console.log('test'))
    app.use((err, req, res, next) => {
        const status = err.statusCode || 500;
        const message = err.message || 'Internal Server Error';
  
        console.error('[Error Middleware]', err); // Optional
        res.status(status).json({ msg: message });
      });
    // app.get('*', (req, res) => {
    // res.sendFile(path.join(__dirname, 'dist', 'index.html'));
    // });
    // 3. Start server
    app.listen(env.APP_PORT, '0.0.0.0', () => {
        console.log(`server is running on port: ${env.APP_PORT}`)
    })

    // 4. Handle graceful shutdown
    AsyncExitHook(() => {
        console.log('Disconnecting from Database')
        CLOSE_DB()
        console.log('Disconnected from Database')
    })
}


(async ()=>{
    try 
    {
        console.log('Connecting to Database')
        await CONNECT_DB()
        console.log('Connected to Database')
        START_SERVER()
    }
    catch(error)
    {
        console.error(error)
        process.exit(0)
    }
   
})()