const nodemailer = require('nodemailer');
const logger = require('./logger');

class EmailService {
  constructor() {
    this.transporter = null;
    this.initializeTransporter();
  }

  initializeTransporter() {
    try {
      const config = {
        host: process.env.SMTP_HOST,
        port: parseInt(process.env.SMTP_PORT) || 587,
        secure: process.env.SMTP_SECURE === 'true', // true for 465, false for other ports
        auth: {
          user: process.env.SMTP_USER,
          pass: process.env.SMTP_PASS,
        },
        tls: {
          rejectUnauthorized: false
        }
      };

      this.transporter = nodemailer.createTransporter(config);

      logger.info('Email transporter initialized', {
        host: config.host,
        port: config.port,
        secure: config.secure,
        user: config.auth.user
      });
    } catch (error) {
      logger.error('Failed to initialize email transporter', {
        error: error.message,
        stack: error.stack
      });
    }
  }

  async verifyConnection() {
    try {
      if (!this.transporter) {
        throw new Error('Email transporter not initialized');
      }

      await this.transporter.verify();
      logger.info('Email connection verified successfully');
      return { success: true };
    } catch (error) {
      logger.error('Email connection verification failed', {
        error: error.message,
        stack: error.stack
      });
      return { success: false, error: error.message };
    }
  }

  generateEmailHTML(data) {
    const { name, email, subject, message, ip, userAgent, timestamp } = data;
    
    return `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>New Contact Form Submission</title>
    <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: #f4f4f4; padding: 20px; text-align: center; }
        .content { padding: 20px; }
        .field { margin-bottom: 15px; }
        .label { font-weight: bold; color: #555; }
        .value { margin-top: 5px; padding: 10px; background: #f9f9f9; border-radius: 4px; }
        .meta { font-size: 12px; color: #888; border-top: 1px solid #eee; padding-top: 15px; margin-top: 20px; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h2>New Contact Form Submission</h2>
        </div>
        <div class="content">
            <div class="field">
                <div class="label">Name:</div>
                <div class="value">${name}</div>
            </div>
            <div class="field">
                <div class="label">Email:</div>
                <div class="value">${email}</div>
            </div>
            <div class="field">
                <div class="label">Subject:</div>
                <div class="value">${subject}</div>
            </div>
            <div class="field">
                <div class="label">Message:</div>
                <div class="value">${message.replace(/\n/g, '<br>')}</div>
            </div>
            <div class="meta">
                <p><strong>Submission Details:</strong></p>
                <p>Timestamp: ${timestamp}</p>
                <p>IP Address: ${ip}</p>
                <p>User Agent: ${userAgent}</p>
            </div>
        </div>
    </div>
</body>
</html>
    `.trim();
  }

  generateEmailText(data) {
    const { name, email, subject, message, ip, userAgent, timestamp } = data;
    
    return `
NEW CONTACT FORM SUBMISSION
==========================

Name: ${name}
Email: ${email}
Subject: ${subject}

Message:
${message}

---
Submission Details:
Timestamp: ${timestamp}
IP Address: ${ip}
User Agent: ${userAgent}
    `.trim();
  }

  async sendContactEmail(data) {
    try {
      if (!this.transporter) {
        throw new Error('Email transporter not initialized');
      }

      const { name, email, subject } = data;

      const mailOptions = {
        from: `${process.env.FROM_NAME || 'Contact Form'} <${process.env.FROM_EMAIL || process.env.SMTP_USER}>`,
        to: process.env.ADMIN_EMAIL,
        subject: `Contact Form: ${subject}`,
        text: this.generateEmailText(data),
        html: this.generateEmailHTML(data),
        replyTo: email,
        headers: {
          'X-Contact-Form': 'true',
          'X-Sender-IP': data.ip,
          'X-Sender-Name': name
        }
      };

      const info = await this.transporter.sendMail(mailOptions);

      logger.info('Contact email sent successfully', {
        messageId: info.messageId,
        to: process.env.ADMIN_EMAIL,
        from: email,
        subject,
        accepted: info.accepted,
        rejected: info.rejected
      });

      return {
        success: true,
        messageId: info.messageId,
        accepted: info.accepted,
        rejected: info.rejected
      };
    } catch (error) {
      logger.error('Failed to send contact email', {
        error: error.message,
        stack: error.stack,
        data: {
          name: data.name,
          email: data.email,
          subject: data.subject
        }
      });

      return {
        success: false,
        error: error.message
      };
    }
  }

  async sendTestEmail() {
    try {
      const testData = {
        name: 'Test User',
        email: 'test@example.com',
        subject: 'Test Email',
        message: 'This is a test email to verify the email service is working correctly.',
        ip: '127.0.0.1',
        userAgent: 'Test Agent',
        timestamp: new Date().toISOString()
      };

      return await this.sendContactEmail(testData);
    } catch (error) {
      logger.error('Test email failed', {
        error: error.message,
        stack: error.stack
      });

      return {
        success: false,
        error: error.message
      };
    }
  }
}

// Create singleton instance
const emailService = new EmailService();

module.exports = emailService;