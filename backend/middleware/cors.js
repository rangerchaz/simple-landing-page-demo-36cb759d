const cors = require('cors');
const logger = require('../utils/logger');

// CORS configuration
const corsOptions = {
  origin: (origin, callback) => {
    // Allow requests with no origin (mobile apps, Postman, etc.)
    if (!origin) return callback(null, true);

    const allowedOrigins = process.env.ALLOWED_ORIGINS 
      ? process.env.ALLOWED_ORIGINS.split(',').map(url => url.trim())
      : ['http://localhost:3000', 'http://127.0.0.1:3000'];

    if (allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      logger.warn('CORS blocked request', {
        origin,
        allowedOrigins,
        timestamp: new Date().toISOString()
      });
      
      callback(new Error('Not allowed by CORS policy'));
    }
  },
  methods: ['GET', 'POST', 'OPTIONS'],
  allowedHeaders: [
    'Origin',
    'X-Requested-With',
    'Content-Type',
    'Accept',
    'Authorization',
    'Cache-Control',
    'Pragma'
  ],
  credentials: false,
  maxAge: 86400, // Cache preflight response for 24 hours
  optionsSuccessStatus: 200 // Some legacy browsers choke on 204
};

// Create CORS middleware
const corsMiddleware = cors(corsOptions);

// Custom CORS error handler
const handleCorsError = (err, req, res, next) => {
  if (err.message === 'Not allowed by CORS policy') {
    logger.error('CORS error', {
      origin: req.headers.origin,
      method: req.method,
      url: req.url,
      ip: req.ip,
      userAgent: req.get('User-Agent')
    });

    return res.status(403).json({
      success: false,
      message: 'CORS policy violation: Origin not allowed',
      timestamp: new Date().toISOString()
    });
  }
  
  next(err);
};

module.exports = {
  corsMiddleware,
  handleCorsError,
  corsOptions
};