import express from 'express';
import { CONNECT_DB, GET_DB, CLOSE_DB } from './config/mongodb.js';
import AsyncExitHook from 'async-exit-hook';
import { env } from './config/environment.js';
import APIs_V1 from './routes/v1/index.js';
import cookieParser from 'cookie-parser';
import helmet from 'helmet'
const app = express();
const START_SERVER = ()=>
    {app.use(helmet({
    contentSecurityPolicy: false,
    }));
    app.use(cookieParser());
    app.use(express.json());
    app.use(express.urlencoded({extended:true}));
    app.use('/v1', APIs_V1);
    app.use((err, req, res, next)=>
    {
        const status = err.statusCode || 500;
        const message = err.message || 'Internal Server Error';
        console.log('[Error Middleware]', err);
        res.status(status).json({msg:message});
    })
    app.listen(env.APP_PORT, '0.0.0.0', ()=>
    {
        console.log(`Server is running on port: ${env.APP_PORT}`)
    })
    AsyncExitHook(()=>
    {
        console.log('Disconnecting from Database');
        CLOSE_DB();
        console.log('Disconnected from Database');
    })
}
(async()=>{
    try 
    {
        console.log('Connecting to Database');
        await CONNECT_DB();
        console.log('Connected to Database');
        START_SERVER();
    }
    catch(err)
    {
        console.error('Database connection failed:', err);
         process.exit(1); // Use non-zero exit code for errors
    }
})()