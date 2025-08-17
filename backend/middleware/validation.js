const { body } = require('express-validator');
const validator = require('validator');

// Contact form validation middleware
const contactValidation = [
  body('name')
    .trim()
    .notEmpty()
    .withMessage('Name is required')
    .isLength({ min: 2, max: 100 })
    .withMessage('Name must be between 2 and 100 characters')
    .matches(/^[a-zA-Z\s\-'\.]+$/)
    .withMessage('Name can only contain letters, spaces, hyphens, apostrophes, and periods')
    .customSanitizer((value) => {
      // Remove any potential XSS attempts
      return validator.escape(value);
    }),

  body('email')
    .trim()
    .notEmpty()
    .withMessage('Email is required')
    .isEmail()
    .withMessage('Please provide a valid email address')
    .normalizeEmail({
      gmail_remove_dots: false,
      gmail_remove_subaddress: false,
      outlookdotcom_remove_subaddress: false,
      yahoo_remove_subaddress: false,
      icloud_remove_subaddress: false
    })
    .isLength({ max: 254 })
    .withMessage('Email address is too long')
    .custom((value) => {
      // Additional email validation
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(value)) {
        throw new Error('Invalid email format');
      }
      
      // Check for common disposable email domains
      const disposableDomains = [
        '10minutemail.com',
        'tempmail.org',
        'guerrillamail.com',
        'mailinator.com'
      ];
      
      const domain = value.split('@')[1].toLowerCase();
      if (disposableDomains.includes(domain)) {
        throw new Error('Please use a permanent email address');
      }
      
      return true;
    }),

  body('subject')
    .trim()
    .notEmpty()
    .withMessage('Subject is required')
    .isLength({ min: 5, max: 200 })
    .withMessage('Subject must be between 5 and 200 characters')
    .customSanitizer((value) => {
      return validator.escape(value);
    }),

  body('message')
    .trim()
    .notEmpty()
    .withMessage('Message is required')
    .isLength({ min: 10, max: 1000 })
    .withMessage('Message must be between 10 and 1000 characters')
    .customSanitizer((value) => {
      return validator.escape(value);
    })
    .custom((value) => {
      // Check for spam-like content
      const spamPatterns = [
        /viagra/i,
        /casino/i,
        /lottery/i,
        /winner/i,
        /congratulations.*won/i,
        /click.*here.*now/i,
        /urgent.*response/i,
        /limited.*time.*offer/i
      ];
      
      if (spamPatterns.some(pattern => pattern.test(value))) {
        throw new Error('Message contains prohibited content');
      }
      
      return true;
    })
];

module.exports = {
  contactValidation
};