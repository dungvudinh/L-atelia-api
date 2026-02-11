// controllers/newsletterController.js
import { StatusCodes } from "http-status-codes";
import nodemailer from 'nodemailer';

// @desc    Subscribe to newsletter
// @route   POST /api/newsletter/subscribe
export const subscribeToNewsletter = async (req, res) => {
    try {
        const {
            fullName,
            email,
            consent,
            source = 'website_footer'
        } = req.body;
        
        console.log('Newsletter subscription request:', {
            fullName,
            email,
            consent,
            source
        });
        
        // Validate required fields
        if (!fullName || !email) {
            return res.status(StatusCodes.BAD_REQUEST).json({
                success: false,
                message: 'Full name and email are required'
            });
        }

        if (!consent) {
            return res.status(StatusCodes.BAD_REQUEST).json({
                success: false,
                message: 'Privacy policy consent is required'
            });
        }

        if (!/\S+@\S+\.\S+/.test(email)) {
            return res.status(StatusCodes.BAD_REQUEST).json({
                success: false,
                message: 'Invalid email format'
            });
        }

        // Configure nodemailer transporter
        const transporter = nodemailer.createTransport({
            host: process.env.SMTP_HOST || 'smtp.gmail.com',
            port: process.env.SMTP_PORT || 587,
            secure: false,
            auth: {
                user: process.env.SMTP_USER,
                pass: process.env.SMTP_PASS
            }
        });

        // Email cho admin - thông báo có người đăng ký newsletter
        const adminMailOptions = {
            from: process.env.SMTP_FROM || `"LATELIA Newsletter" <${process.env.SMTP_USER}>`,
            to: process.env.NEWSLETTER_EMAIL || process.env.SMTP_USER,
            subject: `📬 New Newsletter Subscription - ${fullName}`,
            html: `
                <!DOCTYPE html>
                <html>
                <head>
                    <style>
                        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
                        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                        .header { background: #2f5855; color: white; padding: 20px; text-align: center; }
                        .content { background: #f9f9f9; padding: 20px; }
                        .field { margin-bottom: 15px; }
                        .label { font-weight: bold; color: #2f5855; }
                        .value { margin-top: 5px; }
                        .stats { background: #e8f4f3; padding: 15px; border-radius: 5px; margin: 20px 0; }
                    </style>
                </head>
                <body>
                    <div class="container">
                        <div class="header">
                            <h1>🎉 New Newsletter Subscriber</h1>
                            <p>Someone has subscribed to your newsletter</p>
                        </div>
                        
                        <div class="content">
                            <div class="field">
                                <div class="label">Subscriber Name:</div>
                                <div class="value">${fullName}</div>
                            </div>
                            <div class="field">
                                <div class="label">Email Address:</div>
                                <div class="value">${email}</div>
                            </div>
                            <div class="field">
                                <div class="label">Source:</div>
                                <div class="value">${source}</div>
                            </div>
                            <div class="field">
                                <div class="label">Subscription Date:</div>
                                <div class="value">${new Date().toLocaleString()}</div>
                            </div>
                            
                            <div class="stats">
                                <h3 style="color: #2f5855; margin-top: 0;">📊 Quick Stats</h3>
                                <p>This subscriber has joined your exclusive list and will receive:</p>
                                <ul>
                                    <li>Latest property updates</li>
                                    <li>Exclusive project launches</li>
                                    <li>Market insights and tips</li>
                                    <li>Special promotions and events</li>
                                </ul>
                            </div>
                        </div>
                    </div>
                </body>
                </html>
            `
        };

        // Email cho subscriber - confirmation email
        const subscriberMailOptions = {
            from: process.env.SMTP_FROM || `"LATELIA Newsletter" <${process.env.SMTP_USER}>`,
            to: email,
            replyTo: process.env.REPLY_TO_EMAIL || process.env.SMTP_USER,
            subject: `🎉 Welcome to LATELIA Newsletter, ${fullName}!`,
            html: `
                <!DOCTYPE html>
                <html>
                <head>
                    <meta charset="UTF-8">
                    <style>
                        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; }
                        .header { background: #2f5855; color: white; padding: 30px 20px; text-align: center; border-radius: 5px 5px 0 0; }
                        .welcome-box { background: #f8f9fa; border-left: 4px solid #2f5855; padding: 20px; margin: 25px 0; }
                        .benefits { margin: 25px 0; }
                        .benefit-item { display: flex; align-items: flex-start; margin-bottom: 15px; }
                        .benefit-icon { color: #2f5855; margin-right: 10px; font-size: 20px; }
                        .footer { margin-top: 30px; padding-top: 20px; border-top: 1px solid #ddd; font-size: 14px; color: #666; }
                        .btn { display: inline-block; background: #2f5855; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; margin-top: 20px; }
                    </style>
                </head>
                <body>
                    <div class="header">
                        <h1 style="margin: 0; font-size: 28px;">LATELIA</h1>
                        <p style="margin: 5px 0 0; opacity: 0.9;">Premium Real Estate Newsletter</p>
                    </div>
                    
                    <div style="padding: 30px 20px;">
                        <div style="font-size: 18px; margin-bottom: 20px;">
                            Dear <strong>${fullName}</strong>,
                        </div>
                        
                        <div class="welcome-box">
                            <h2 style="color: #2f5855; margin-top: 0;">🎉 Welcome to Our Exclusive Community!</h2>
                            <p>Thank you for subscribing to the LATELIA newsletter. You've just joined an exclusive group of property enthusiasts and investors who receive:</p>
                        </div>
                        
                        <div class="benefits">
                            <div class="benefit-item">
                                <span class="benefit-icon">🏠</span>
                                <div>
                                    <strong>First Access to New Projects</strong>
                                    <p style="margin: 5px 0 0; font-size: 14px; color: #666;">Be the first to know about our latest luxury property launches</p>
                                </div>
                            </div>
                            
                            <div class="benefit-item">
                                <span class="benefit-icon">💰</span>
                                <div>
                                    <strong>Exclusive Investment Opportunities</strong>
                                    <p style="margin: 5px 0 0; font-size: 14px; color: #666;">Special offers and pre-launch discounts available only to subscribers</p>
                                </div>
                            </div>
                            
                            <div class="benefit-item">
                                <span class="benefit-icon">📈</span>
                                <div>
                                    <strong>Market Insights & Trends</strong>
                                    <p style="margin: 5px 0 0; font-size: 14px; color: #666;">Expert analysis and updates on the real estate market</p>
                                </div>
                            </div>
                            
                            <div class="benefit-item">
                                <span class="benefit-icon">🎁</span>
                                <div>
                                    <strong>VIP Event Invitations</strong>
                                    <p style="margin: 5px 0 0; font-size: 14px; color: #666;">Invitations to exclusive property viewings and networking events</p>
                                </div>
                            </div>
                        </div>
                        
                        <div style="margin: 30px 0; text-align: center;">
                            <p>Stay tuned for our next newsletter, coming soon!</p>
                            <a href="https://www.latelia.com" class="btn">VISIT OUR WEBSITE</a>
                        </div>
                        
                        <div style="background: #e8f4f3; padding: 20px; border-radius: 5px; margin: 25px 0;">
                            <h4 style="color: #2f5855; margin-top: 0;">💡 What's Next?</h4>
                            <p>In your next email from us, you'll receive:</p>
                            <ul style="margin: 10px 0; padding-left: 20px;">
                                <li>Our latest project portfolio</li>
                                <li>Tips for property investment</li>
                                <li>Exclusive subscriber-only content</li>
                            </ul>
                        </div>
                        
                        <div style="margin-top: 30px; font-style: italic; color: #666;">
                            "We're excited to have you as part of our community of discerning property investors."
                        </div>
                        
                        <div style="margin-top: 40px;">
                            <strong>Warm regards,</strong><br>
                            <strong>The LATELIA Team</strong>
                        </div>
                    </div>
                    
                    <div class="footer">
                        <p><strong>LATELIA Newsletter</strong></p>
                        <p>📞 Hotline: 096 428 2298</p>
                        <p>🌐 Website: <a href="https://www.latelia.com" style="color: #2f5855;">www.latelia.com</a></p>
                        <p>📧 Email: <a href="mailto:latelia.sale@gmail.com" style="color: #2f5855;">latelia.sale@gmail.com</a></p>
                        
                        <div style="margin-top: 20px; font-size: 12px; color: #999;">
                            <p>You're receiving this email because you subscribed to LATELIA newsletter.</p>
                            <p><a href="%unsubscribe_url%" style="color: #666;">Unsubscribe</a> | 
                               <a href="%update_preferences_url%" style="color: #666;">Update preferences</a></p>
                        </div>
                    </div>
                </body>
                </html>
            `
        };

        // Send emails
        await transporter.sendMail(adminMailOptions);
        await transporter.sendMail(subscriberMailOptions);

        // TODO: You might want to save subscriber to database here
        // Example:
        // const subscriber = await Newsletter.create({
        //     fullName,
        //     email,
        //     source,
        //     subscribedAt: new Date()
        // });

        res.status(StatusCodes.OK).json({
            success: true,
            message: 'Successfully subscribed to newsletter',
            data: {
                fullName,
                email,
                source,
                subscribedAt: new Date().toISOString()
            }
        });

    } catch (error) {
        console.error('Error subscribing to newsletter:', error);
        res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
            success: false,
            message: 'Failed to subscribe to newsletter',
            error: error.message
        });
    }
};

// Optional: Get all subscribers (for admin)
export const getSubscribers = async (req, res) => {
    try {
        // TODO: Implement database query
        // const subscribers = await Newsletter.find().sort({ subscribedAt: -1 });
        
        res.status(StatusCodes.OK).json({
            success: true,
            message: 'Subscribers retrieved successfully',
            data: [] // Replace with actual data
        });
    } catch (error) {
        console.error('Error getting subscribers:', error);
        res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
            success: false,
            message: 'Failed to get subscribers',
            error: error.message
        });
    }
};

// Optional: Unsubscribe
export const unsubscribe = async (req, res) => {
    try {
        const { email } = req.body;
        
        if (!email) {
            return res.status(StatusCodes.BAD_REQUEST).json({
                success: false,
                message: 'Email is required'
            });
        }

        // TODO: Implement unsubscribe logic in database
        // await Newsletter.findOneAndUpdate(
        //     { email },
        //     { unsubscribedAt: new Date(), isActive: false }
        // );

        res.status(StatusCodes.OK).json({
            success: true,
            message: 'Successfully unsubscribed from newsletter',
            data: { email }
        });
    } catch (error) {
        console.error('Error unsubscribing:', error);
        res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
            success: false,
            message: 'Failed to unsubscribe',
            error: error.message
        });
    }
};