const express = require('express');
const rateLimit = require('express-rate-limit');
const { validationResult } = require('express-validator');
const { contactValidation } = require('../middleware/validation');
const emailService = require('../utils/emailService');
const logger = require('../utils/logger');

const router = express.Router();

// Rate limiting for contact form
const contactRateLimit = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 60 * 60 * 1000, // 1 hour
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 5, // limit each IP to 5 requests per windowMs
  message: {
    success: false,
    message: 'Too many contact form submissions. Please try again later.',
    retryAfter: 3600
  },
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    logger.warn('Rate limit exceeded for contact form', {
      ip: req.ip,
      userAgent: req.get('User-Agent'),
      url: req.originalUrl
    });
    
    res.status(429).json({
      success: false,
      message: 'Too many contact form submissions. Please try again later.',
      retryAfter: 3600
    });
  }
});

// POST /api/contact - Handle contact form submissions
router.post('/contact', contactRateLimit, contactValidation, async (req, res) => {
  try {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      logger.warn('Contact form validation failed', {
        errors: errors.array(),
        ip: req.ip,
        userAgent: req.get('User-Agent')
      });

      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array().map(error => ({
          field: error.path,
          message: error.msg,
          value: error.value
        }))
      });
    }

    const { name, email, subject, message } = req.body;

    // Log contact form submission
    logger.info('Contact form submission received', {
      name,
      email,
      subject,
      ip: req.ip,
      userAgent: req.get('User-Agent'),
      timestamp: new Date().toISOString()
    });

    // Send email
    const emailResult = await emailService.sendContactEmail({
      name,
      email,
      subject,
      message,
      ip: req.ip,
      userAgent: req.get('User-Agent'),
      timestamp: new Date().toISOString()
    });

    if (emailResult.success) {
      logger.info('Contact email sent successfully', {
        messageId: emailResult.messageId,
        to: process.env.ADMIN_EMAIL,
        from: email
      });

      res.status(200).json({
        success: true,
        message: 'Thank you for your message! We will get back to you soon.',
        timestamp: new Date().toISOString()
      });
    } else {
      logger.error('Failed to send contact email', {
        error: emailResult.error,
        email,
        name,
        subject
      });

      res.status(500).json({
        success: false,
        message: 'Failed to send your message. Please try again later.',
        timestamp: new Date().toISOString()
      });
    }
  } catch (error) {
    logger.error('Contact form submission error', {
      error: error.message,
      stack: error.stack,
      body: req.body,
      ip: req.ip
    });

    res.status(500).json({
      success: false,
      message: 'An unexpected error occurred. Please try again later.',
      timestamp: new Date().toISOString()
    });
  }
});

module.exports = router;