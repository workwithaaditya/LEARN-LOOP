import nodemailer from 'nodemailer';
import dotenv from 'dotenv';

dotenv.config();

// Email transporter configuration
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER, // Your Gmail address
    pass: process.env.EMAIL_PASS  // Your Gmail App Password
  }
});

// Verify transporter configuration
transporter.verify((error, success) => {
  if (error) {
    console.log('❌ Email service error:', error);
  } else {
    console.log('✅ Email service ready');
  }
});

/**
 * Send ping notification email
 * @param {Object} options - Email options
 * @param {string} options.to - Receiver email
 * @param {string} options.receiverName - Receiver's name
 * @param {string} options.senderName - Sender's name
 * @param {string} options.message - Ping message
 */
export const sendPingNotification = async ({ to, receiverName, senderName, message }) => {
  try {
    const mailOptions = {
      from: `"Learn Loop" <${process.env.EMAIL_USER}>`,
      to: to,
      subject: `🔔 New Ping from ${senderName} on Learn Loop`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body {
              font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
              line-height: 1.6;
              color: #333;
              background-color: #f4f4f4;
              margin: 0;
              padding: 0;
            }
            .container {
              max-width: 600px;
              margin: 20px auto;
              background: white;
              border-radius: 12px;
              overflow: hidden;
              box-shadow: 0 4px 12px rgba(0,0,0,0.1);
            }
            .header {
              background: linear-gradient(135deg, #dc2626 0%, #991b1b 100%);
              color: white;
              padding: 30px 20px;
              text-align: center;
            }
            .header h1 {
              margin: 0;
              font-size: 28px;
              font-weight: 700;
            }
            .content {
              padding: 30px;
            }
            .message-box {
              background: #f9fafb;
              border-left: 4px solid #dc2626;
              padding: 20px;
              margin: 20px 0;
              border-radius: 8px;
            }
            .message-box p {
              margin: 0;
              font-size: 16px;
              color: #1f2937;
            }
            .sender-info {
              font-weight: 600;
              color: #dc2626;
              font-size: 18px;
              margin-bottom: 10px;
            }
            .button {
              display: inline-block;
              background: #dc2626;
              color: white;
              padding: 14px 28px;
              text-decoration: none;
              border-radius: 8px;
              font-weight: 600;
              margin-top: 20px;
              transition: background 0.3s ease;
            }
            .button:hover {
              background: #991b1b;
            }
            .footer {
              background: #f9fafb;
              padding: 20px;
              text-align: center;
              color: #6b7280;
              font-size: 14px;
              border-top: 1px solid #e5e7eb;
            }
            .emoji {
              font-size: 48px;
              margin: 10px 0;
            }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <div class="emoji">👋</div>
              <h1>New Ping Received!</h1>
            </div>
            <div class="content">
              <p>Hi <strong>${receiverName}</strong>,</p>
              <p style="margin-top: 10px;">You've received a new ping from:</p>
              
              <div class="message-box">
                <div class="sender-info">📨 ${senderName}</div>
                <p>"${message}"</p>
              </div>
              
              <p>Connect with them on Learn Loop to start learning together!</p>
              
              <center>
                <a href="https://learn-loop-ten.vercel.app/dashboard.html" class="button">
                  View on Learn Loop →
                </a>
              </center>
            </div>
            <div class="footer">
              <p>This is an automated notification from Learn Loop</p>
              <p style="margin-top: 5px;">© ${new Date().getFullYear()} Learn Loop. All rights reserved.</p>
            </div>
          </div>
        </body>
        </html>
      `
    };

    const info = await transporter.sendMail(mailOptions);
    console.log('✅ Email sent:', info.messageId);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('❌ Error sending email:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Send friend request notification email
 * @param {Object} options - Email options
 */
export const sendFriendRequestNotification = async ({ to, receiverName, senderName }) => {
  try {
    const mailOptions = {
      from: `"Learn Loop" <${process.env.EMAIL_USER}>`,
      to: to,
      subject: `👥 New Friend Request from ${senderName}`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 20px auto; background: white; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 12px rgba(0,0,0,0.1); }
            .header { background: linear-gradient(135deg, #dc2626 0%, #991b1b 100%); color: white; padding: 30px 20px; text-align: center; }
            .content { padding: 30px; }
            .button { display: inline-block; background: #dc2626; color: white; padding: 14px 28px; text-decoration: none; border-radius: 8px; font-weight: 600; margin-top: 20px; }
            .footer { background: #f9fafb; padding: 20px; text-align: center; color: #6b7280; font-size: 14px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>🤝 New Friend Request</h1>
            </div>
            <div class="content">
              <p>Hi <strong>${receiverName}</strong>,</p>
              <p><strong>${senderName}</strong> wants to connect with you on Learn Loop!</p>
              <center>
                <a href="https://learn-loop-ten.vercel.app/dashboard.html" class="button">Accept Request →</a>
              </center>
            </div>
            <div class="footer">
              <p>© ${new Date().getFullYear()} Learn Loop. All rights reserved.</p>
            </div>
          </div>
        </body>
        </html>
      `
    };

    const info = await transporter.sendMail(mailOptions);
    console.log('✅ Friend request email sent:', info.messageId);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('❌ Error sending friend request email:', error);
    return { success: false, error: error.message };
  }
};

export default transporter;
