// services/emailService.js
import nodemailer from 'nodemailer';
import {env} from '../config/environment'
class EmailService {
  constructor() {
    // SỬA: createTransporter → createTransport
    this.transporter = nodemailer.createTransport({
      host: env.SMTP_HOST || 'smtp.gmail.com',
      port: env.SMTP_PORT || 587,
      secure: false,
      auth: {
        user: env.SMTP_USER,
        pass: env.SMTP_PASS,
      },
    });
  }

  // Verify transporter configuration
  async verifyTransporter() {
    try {
      await this.transporter.verify();
      console.log('✅ SMTP transporter is ready');
      return true;
    } catch (error) {
      console.error('❌ SMTP transporter error:', error);
      return false;
    }
  }

  // Send booking confirmation email
  async sendBookingConfirmation(booking, property) {
    try {
      console.log(property)
      const nights = Math.ceil((new Date(booking.checkOut) - new Date(booking.checkIn)) / (1000 * 60 * 60 * 24));
      const totalAmount = nights * property.price;

      const mailOptions = {
        from: `"${env.EMAIL_FROM_NAME || 'Booking System'}" <${env.SMTP_USER}>`,
        to: booking.customer.email,
        subject: `Booking Confirmation - ${booking.bookingNumber}`,
        html: this.generateConfirmationEmail(booking, property, nights, totalAmount),
      };

      const result = await this.transporter.sendMail(mailOptions);
      console.log('✅ Booking confirmation email sent:', result.messageId);
      return { success: true, messageId: result.messageId };
    } catch (error) {
      console.error('❌ Error sending booking confirmation:', error);
      throw new Error('Failed to send booking confirmation email');
    }
  }

  // Send booking update email
  async sendBookingUpdate(booking, property, changes = []) {
    try {
      const nights = Math.ceil((new Date(booking.checkOut) - new Date(booking.checkIn)) / (1000 * 60 * 60 * 24));
      const totalAmount = nights * property.price;

      const mailOptions = {
        from: `"${env.EMAIL_FROM_NAME || 'Booking System'}" <${env.SMTP_USER}>`,
        to: booking.customer.email,
        subject: `Booking Update - ${booking.bookingNumber}`,
        html: this.generateUpdateEmail(booking, property, nights, totalAmount, changes),
      };

      const result = await this.transporter.sendMail(mailOptions);
      console.log('✅ Booking update email sent:', result.messageId);
      return { success: true, messageId: result.messageId };
    } catch (error) {
      console.error('❌ Error sending booking update:', error);
      throw new Error('Failed to send booking update email');
    }
  }

  // Send booking cancellation email
  async sendBookingCancellation(booking, property) {
    try {
      const mailOptions = {
        from: `"${env.EMAIL_FROM_NAME || 'Booking System'}" <${env.SMTP_USER}>`,
        to: booking.customer.email,
        subject: `Booking Cancelled - ${booking.bookingNumber}`,
        html: this.generateCancellationEmail(booking, property),
      };

      const result = await this.transporter.sendMail(mailOptions);
      console.log('✅ Booking cancellation email sent:', result.messageId);
      return { success: true, messageId: result.messageId };
    } catch (error) {
      console.error('❌ Error sending booking cancellation:', error);
      throw new Error('Failed to send booking cancellation email');
    }
  }

  // Generate confirmation email template
  generateConfirmationEmail(booking, property, nights, totalAmount) {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: #2f5855; color: white; padding: 20px; text-align: center; }
        .content { background: #f9fafb; padding: 20px; }
        .booking-details { background: white; padding: 20px; border-radius: 8px; margin: 20px 0; }
        .footer { text-align: center; padding: 20px; color: #6b7280; font-size: 14px; }
        .highlight { color: #2f5855; font-weight: bold; }
        .contact-info { 
          background: white; 
          padding: 20px; 
          border-radius: 8px; 
          margin: 20px 0;
          border-left: 4px solid #2f5855;
        }
        .contact-item { margin: 10px 0; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>Xác nhận đặt phòng!</h1>
          <p>Phòng của bạn đã được đặt thành công</p>
        </div>
        
        <div class="content">
          <div class="booking-details">
            <h2>Thông tin đặt phòng</h2>
            <p><strong>Mã đặt phòng:</strong> <span class="highlight">${booking.bookingNumber}</span></p>
            <p><strong>Tài sản:</strong> ${property.title}</p>
            <p><strong>Địa điểm:</strong> ${property.location}</p>
            <p><strong>Ngày nhận phòng:</strong> ${new Date(booking.checkIn).toLocaleDateString()}</p>
            <p><strong>Ngày trả phòng:</strong> ${new Date(booking.checkOut).toLocaleDateString()}</p>
            <p><strong>Số đêm:</strong> ${nights}</p>
            <p><strong>Số khách:</strong> ${booking.adults} người lớn, ${booking.children} trẻ em</p>
            <p><strong>Tổng số tiền:</strong> $${totalAmount}</p>
            
            ${booking.specialRequests ? `
              <p><strong>Yêu cầu đặc biệt:</strong> ${booking.specialRequests}</p>
            ` : ''}
          </div>
          
          <div class="contact-info">
            <h3>Thông tin liên hệ</h3>
            <div class="contact-item">
              <strong>📞 Hotline:</strong> <span class="highlight">+84 096 428 2298</span>
            </div>
            <div class="contact-item">
              <strong>👨‍💼 Người phụ trách:</strong> Mr Tùng - Phụ trách Kinh doanh
            </div>
            <div class="contact-item">
              <strong>⏰ Giờ làm việc:</strong>
              <ul style="margin: 5px 0 0 20px;">
                <li>Thứ 2 - Thứ 6: 10:00-14:00 & 16:00-20:00</li>
                <li>Thứ 7 - Chủ nhật: Chỉ dành cho hẹn trước</li>
              </ul>
            </div>
          </div>
          
          <div style="text-align: center; margin: 30px 0;">
            <p>Đặt phòng của bạn đã được xác nhận! Chúng tôi mong chờ được đón tiếp bạn.</p>
            <p>Nếu có bất kỳ câu hỏi nào, vui lòng liên hệ với chúng tôi qua thông tin trên.</p>
          </div>
        </div>
        
        <div class="footer">
          <p>&copy; ${new Date().getFullYear()} ${env.COMPANY_NAME || 'Booking System'}. All rights reserved.</p>
        </div>
      </div>
    </body>
    </html>
  `;
}

  // Generate update email template
  generateUpdateEmail(booking, property, nights, totalAmount, changes) {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: #f59e0b; color: white; padding: 20px; text-align: center; }
        .content { background: #f9fafb; padding: 20px; }
        .booking-details { background: white; padding: 20px; border-radius: 8px; margin: 20px 0; }
        .changes { background: #fef3c7; padding: 15px; border-radius: 8px; margin: 15px 0; }
        .footer { text-align: center; padding: 20px; color: #6b7280; font-size: 14px; }
        .highlight { color: #2563eb; font-weight: bold; }
        .contact-info { 
          background: white; 
          padding: 20px; 
          border-radius: 8px; 
          margin: 20px 0;
          border-left: 4px solid #f59e0b;
        }
        .contact-item { margin: 10px 0; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>Cập nhật đặt phòng</h1>
          <p>Đặt phòng của bạn đã được cập nhật</p>
        </div>
        
        <div class="content">
          ${changes.length > 0 ? `
            <div class="changes">
              <h3>Thay đổi đã thực hiện:</h3>
              <ul>
                ${changes.map(change => `<li>${change}</li>`).join('')}
              </ul>
            </div>
          ` : ''}
          
          <div class="booking-details">
            <h2>Thông tin đặt phòng đã cập nhật</h2>
            <p><strong>Mã đặt phòng:</strong> <span class="highlight">${booking.bookingNumber}</span></p>
            <p><strong>Tài sản:</strong> ${property.title}</p>
            <p><strong>Địa điểm:</strong> ${property.location}</p>
            <p><strong>Ngày nhận phòng:</strong> ${new Date(booking.checkIn).toLocaleDateString()}</p>
            <p><strong>Ngày trả phòng:</strong> ${new Date(booking.checkOut).toLocaleDateString()}</p>
            <p><strong>Số đêm:</strong> ${nights}</p>
            <p><strong>Số khách:</strong> ${booking.adults} người lớn, ${booking.children} trẻ em</p>
            <p><strong>Tổng số tiền:</strong> $${totalAmount}</p>
            <p><strong>Trạng thái:</strong> ${booking.status}</p>
            
            ${booking.specialRequests ? `
              <p><strong>Yêu cầu đặc biệt:</strong> ${booking.specialRequests}</p>
            ` : ''}
          </div>
          
          <div class="contact-info">
            <h3>Thông tin liên hệ</h3>
            <div class="contact-item">
              <strong>📞 Hotline:</strong> <span class="highlight">+84 096 428 2298</span>
            </div>
            <div class="contact-item">
              <strong>👨‍💼 Người phụ trách:</strong> Mr Tùng - Phụ trách Kinh doanh
            </div>
            <div class="contact-item">
              <strong>⏰ Giờ làm việc:</strong>
              <ul style="margin: 5px 0 0 20px;">
                <li>Thứ 2 - Thứ 6: 10:00-14:00 & 16:00-20:00</li>
                <li>Thứ 7 - Chủ nhật: Chỉ dành cho hẹn trước</li>
              </ul>
            </div>
          </div>
          
          <div style="text-align: center; margin: 30px 0;">
            <p>Đặt phòng của bạn đã được cập nhật thành công.</p>
            <p>Nếu bạn có bất kỳ câu hỏi nào về những thay đổi này, vui lòng liên hệ với chúng tôi qua thông tin trên.</p>
          </div>
        </div>
        
        <div class="footer">
          <p>&copy; ${new Date().getFullYear()} ${env.COMPANY_NAME || 'Booking System'}. All rights reserved.</p>
        </div>
      </div>
    </body>
    </html>
  `;
}

  // Generate cancellation email template
  generateCancellationEmail(booking, property) {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #ef4444; color: white; padding: 20px; text-align: center; }
          .content { background: #f9fafb; padding: 20px; }
          .booking-details { background: white; padding: 20px; border-radius: 8px; margin: 20px 0; }
          .footer { text-align: center; padding: 20px; color: #6b7280; font-size: 14px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Booking Cancelled</h1>
            <p>Your reservation has been cancelled</p>
          </div>
          
          <div class="content">
            <div class="booking-details">
              <h2>Cancelled Booking Details</h2>
              <p><strong>Booking Number:</strong> ${booking.bookingNumber}</p>
              <p><strong>Property:</strong> ${property.title}</p>
              <p><strong>Location:</strong> ${property.location}</p>
              <p><strong>Check-in:</strong> ${new Date(booking.checkIn).toLocaleDateString()}</p>
              <p><strong>Check-out:</strong> ${new Date(booking.checkOut).toLocaleDateString()}</p>
            </div>
            
            <div style="text-align: center; margin: 30px 0;">
              <p>Your booking has been cancelled as requested.</p>
              <p>We hope to see you again in the future!</p>
            </div>
          </div>
          
          <div class="footer">
            <p>&copy; ${new Date().getFullYear()} ${env.COMPANY_NAME || 'Booking System'}. All rights reserved.</p>
          </div>
        </div>
      </body>
      </html>
    `;
  }
}

export default new EmailService();