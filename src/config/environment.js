import dotenv from 'dotenv'
dotenv.config()
export const env = {
    MONGODB_URI: process.env.MONGODB_URI,
    DATABASE_NAME: process.env.DATABASE_NAME,
    APP_PORT: process.env.APP_PORT,
    AUTHOR:process.env.AUTHOR, 
    APP_HOST: process.env.APP_HOST,
    JWT_SECRET: process.env.JWT_SECRET,
    EMAIL_HOST:process.env.EMAIL_HOST, 
    EMAIL_PORT: process.env.EMAIL_PORT,
    EMAIL_USER:process.env.EMAIL_USER,
    EMAIL_PASS:process.env.EMAIL_PASS,
    APP_URL:process.env.BUILD_MODE === 'production' ? process.env.PROD_URL : process.env.DEV_URL,
    APP_FRONT_URL: process.env.BUILD_MODE === 'production' ? process.env.PROD_FRONT_URL : process.env.DEV_FRONT_URL,
    RESEND_APIKEY:process.env.RESEND_APIKEY, 
    ACCESS_TOKEN_SECRET_KEY :process.env.ACCESS_TOKEN_SECRET_KEY, 
    REFRESH_TOKEN_SECRET_KEY: process.env.REFRESH_TOKEN_SECRET_KEY,
    CLOUDINARY_NAME: process.env.CLOUDINARY_NAME,
    API_KEY:process.env.API_KEY,
    API_SECRET:process.env.API_SECRET, 
    DEV_FRONT_URL: process.env.DEV_FRONT_URL, 
    PROD_FRONT_URL: process.env.PROD_FRONT_URL,
    DEV_BACK_URL: process.env.DEV_BACK_URL, 
    PROD_BACK_URL: process.env.PROD_BACK_URL
}