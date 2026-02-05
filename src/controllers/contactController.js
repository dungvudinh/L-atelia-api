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

        // // Email content
        // const mailOptions = {
        //     from: process.env.SMTP_FROM || `"Website Contact" <${process.env.SMTP_USER}>`,
        //     to: process.env.CONTACT_EMAIL || process.env.SMTP_USER, // Your receiving email
        //     subject: `New Contact Form Submission - ${firstName} ${lastName}`,
        //     html: `
        //         <!DOCTYPE html>
        //         <html>
        //         <head>
        //             <style>
        //                 body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        //                 .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        //                 .header { background: #2f5855; color: white; padding: 20px; text-align: center; }
        //                 .content { background: #f9f9f9; padding: 20px; }
        //                 .field { margin-bottom: 15px; }
        //                 .label { font-weight: bold; color: #2f5855; }
        //                 .value { margin-top: 5px; }
        //             </style>
        //         </head>
        //         <body>
        //             <div class="container">
        //                 <div class="header">
        //                     <h1>New Contact Form Submission</h1>
        //                 </div>
        //                 <div class="content">
        //                     <div class="field">
        //                         <div class="label">Name:</div>
        //                         <div class="value">${firstName} ${lastName}</div>
        //                     </div>
        //                     <div class="field">
        //                         <div class="label">Email:</div>
        //                         <div class="value">${email}</div>
        //                     </div>
        //                     <div class="field">
        //                         <div class="label">Phone:</div>
        //                         <div class="value">${phone || 'Not provided'}</div>
        //                     </div>
        //                     <div class="field">
        //                         <div class="label">Budget:</div>
        //                         <div class="value">${budget || 'Not specified'}</div>
        //                     </div>
        //                     <div class="field">
        //                         <div class="label">Message:</div>
        //                         <div class="value">${message}</div>
        //                     </div>
        //                     <div class="field">
        //                         <div class="label">Submitted At:</div>
        //                         <div class="value">${new Date().toLocaleString()}</div>
        //                     </div>
        //                 </div>
        //             </div>
        //         </body>
        //         </html>
        //     `
        // };
        console.log('Preparing to send emails...');
         const adminMailOptions = {
            from: email,
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
        const customerMailOptions = {
            from: process.env.SMTP_FROM || `"LATELIA" <${process.env.SMTP_USER}>`,
            to: email, // Email của khách hàng
            replyTo: process.env.REPLY_TO_EMAIL || process.env.SMTP_USER,
            subject: `Cảm ơn bạn đã liên hệ với LATELIA`,
            html: `
                <!DOCTYPE html>
                <html>
                <head>
                    <meta charset="UTF-8">
                    <style>
                        body {
                            font-family: Arial, sans-serif;
                            line-height: 1.6;
                            color: #333;
                            max-width: 600px;
                            margin: 0 auto;
                            padding: 20px;
                        }
                        .header {
                            background-color: #f8f9fa;
                            padding: 20px;
                            text-align: center;
                            border-bottom: 2px solid #2f5855;
                        }
                        .logo {
                            max-width: 150px;
                            margin-bottom: 20px;
                        }
                        .content {
                            padding: 30px 20px;
                        }
                        .greeting {
                            font-size: 18px;
                            margin-bottom: 20px;
                        }
                        .message {
                            margin-bottom: 20px;
                        }
                        .contact-info {
                            background-color: #f8f9fa;
                            padding: 20px;
                            border-radius: 5px;
                            margin: 25px 0;
                        }
                        .contact-detail {
                            margin: 10px 0;
                        }
                        .footer {
                            margin-top: 30px;
                            padding-top: 20px;
                            border-top: 1px solid #ddd;
                            font-size: 14px;
                            color: #666;
                        }
                        .signature {
                            margin-top: 25px;
                            font-weight: bold;
                        }
                        .highlight {
                            color: #2f5855;
                            font-weight: bold;
                        }
                    </style>
                </head>
                <body>
                    <div class="header">
                        <!-- Thêm logo nếu có -->
                        <!-- <img src="https://www.latelia.com/logo.png" alt="LATELIA Logo" class="logo"> -->
                        <h2 style="color: #2f5855; margin: 0;">LATELIA</h2>
                    </div>
                    
                    <div class="content">
                        <div class="greeting">
                            Chào bạn ${firstName} ${lastName},
                        </div>
                        
                        <div class="message">
                            Cảm ơn bạn đã liên hệ với LATELIA. Chúng tôi đã nhận được thông tin của bạn và sẽ xem xét yêu cầu của bạn một cách cẩn thận.
                        </div>
                        
                        <div class="message">
                            Một thành viên của chúng tôi sẽ liên hệ lại với bạn trong thời gian ngắn nhất.
                        </div>
                        
                        <div class="message">
                            Nếu bạn muốn trao đổi sớm hơn, bạn có thể liên hệ trực tiếp theo số điện thoại:
                        </div>
                        
                        <div class="contact-info">
                            <div class="contact-detail">
                                <strong>☎️ Hotline:</strong> +84 096 428 2298
                            </div>
                            <div class="contact-detail">
                                <strong>👨‍💼 Người phụ trách:</strong> Mr Tùng - Phụ trách Kinh doanh
                            </div>
                            <div class="contact-detail">
                                <strong>⏰ Giờ làm việc:</strong> Thứ 2 - Thứ 6: 10:00-14:00 & 16:00-20:00
                            </div>
                            <div class="contact-detail">
                                Thứ 7 - Chủ nhật: Chỉ dành cho hẹn trước
                            </div>
                        </div>
                        
                        <div class="message">
                            Chúng tôi rất mong được trò chuyện và hợp tác cùng bạn!
                        </div>
                        
                        <div class="signature">
                            Trân trọng,<br>
                            <span class="highlight">Mr Tùng</span> / Giám đốc Kinh doanh<br>
                            <strong>LATELIA</strong>
                        </div>
                    </div>
                    
                    <div class="footer">
                        <div style="margin-bottom: 10px;">
                            <strong>Thông tin liên hệ:</strong>
                        </div>
                        <div>
                            📞 Tell/Zalo: 0964282298<br>
                            🌐 Website: <a href="https://www.latelia.com" style="color: #2f5855;">www.latelia.com</a><br>
                            📧 Email: <a href="mailto:latelia.sale@gmail.com" style="color: #2f5855;">latelia.sale@gmail.com</a>
                        </div>
                    </div>
                </body>
                </html>
            `
        };
        // Send email
        await transporter.sendMail(adminMailOptions);
        await transporter.sendMail(customerMailOptions);

        res.status(StatusCodes.OK).json({
            success: true,
            message: 'Contact form submitted successfully and thank you email sent'
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