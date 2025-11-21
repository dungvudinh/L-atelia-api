// controllers/contactController.js
import { StatusCodes } from "http-status-codes";
import nodemailer from 'nodemailer';

// @desc    Submit contact form and send email
// @route   POST /api/contact
export const submitContactForm = async (req, res) => {
    try {
        const {
            firstName,
            lastName,
            email,
            phone,
            budget,
            message,
            consent
        } = req.body;
        console.log(req.body)
        // Validate required fields
        if (!firstName || !lastName || !email || !message) {
            return res.status(StatusCodes.BAD_REQUEST).json({
                success: false,
                message: 'All required fields must be filled'
            });
        }

        if (!consent) {
            return res.status(StatusCodes.BAD_REQUEST).json({
                success: false,
                message: 'Privacy policy consent is required'
            });
        }

        // Configure nodemailer transporter
        const transporter = nodemailer.createTransport({
            host: process.env.SMTP_HOST || 'smtp.gmail.com',
            port: process.env.SMTP_PORT || 587,
            secure: false,
            auth: {
                user: process.env.SMTP_USER, // Your email
                pass: process.env.SMTP_PASS  // Your email password or app password
            }
        });

        // Email content
        const mailOptions = {
            from: process.env.SMTP_FROM || `"Website Contact" <${process.env.SMTP_USER}>`,
            to: process.env.CONTACT_EMAIL || process.env.SMTP_USER, // Your receiving email
            subject: `New Contact Form Submission - ${firstName} ${lastName}`,
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
                    </style>
                </head>
                <body>
                    <div class="container">
                        <div class="header">
                            <h1>New Contact Form Submission</h1>
                        </div>
                        <div class="content">
                            <div class="field">
                                <div class="label">Name:</div>
                                <div class="value">${firstName} ${lastName}</div>
                            </div>
                            <div class="field">
                                <div class="label">Email:</div>
                                <div class="value">${email}</div>
                            </div>
                            <div class="field">
                                <div class="label">Phone:</div>
                                <div class="value">${phone || 'Not provided'}</div>
                            </div>
                            <div class="field">
                                <div class="label">Budget:</div>
                                <div class="value">${budget || 'Not specified'}</div>
                            </div>
                            <div class="field">
                                <div class="label">Message:</div>
                                <div class="value">${message}</div>
                            </div>
                            <div class="field">
                                <div class="label">Submitted At:</div>
                                <div class="value">${new Date().toLocaleString()}</div>
                            </div>
                        </div>
                    </div>
                </body>
                </html>
            `
        };

        // Send email
        await transporter.sendMail(mailOptions);

        res.status(StatusCodes.OK).json({
            success: true,
            message: 'Contact form submitted successfully'
        });

    } catch (error) {
        console.error('Error submitting contact form:', error);
        res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
            success: false,
            message: 'Failed to submit contact form',
            error: error.message
        });
    }
};