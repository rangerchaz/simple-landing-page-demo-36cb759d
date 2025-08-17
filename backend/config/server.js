const config = {
  // Server configuration
  port: process.env.PORT || 3001,
  host: process.env.HOST || '0.0.0.0',
  environment: process.env.NODE_ENV || 'development',
  
  // Security configuration
  corsOrigins: process.env.ALLOWED_ORIGINS 
    ? process.env.ALLOWED_ORIGINS.split(',').map(url => url.trim())
    : ['http://localhost:3000', 'http://127.0.0.1:3000'],
  
  // Rate limiting
  rateLimiting: {
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 60 * 60 * 1000, // 1 hour
    maxRequests: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 5,
    message: 'Too many requests from this IP, please try again later.'
  },
  
  // Email configuration
  email: {
    host: process.env.SMTP_HOST,
    port: parseInt(process.env.SMTP_PORT) || 587,
    secure: process.env.SMTP_SECURE === 'true',
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
    adminEmail: process.env.ADMIN_EMAIL,
    fromEmail: process.env.FROM_EMAIL || process.env.SMTP_USER,
    fromName: process.env.FROM_NAME || 'Landing Page Contact Form'
  },
  
  // Validation limits
  validation: {
    name: {
      minLength: 2,
      maxLength: 100
    },
    email: {
      maxLength: 254
    },
    subject: {
      minLength: 5,
      maxLength: 200
    },
    message: {
      minLength: 10,
      maxLength: 1000
    }
  },
  
  // Logging configuration
  logging: {
    level: process.env.LOG_LEVEL || 'info',
    maxFileAge: 30 // days
  },
  
  // Request body limits
  bodyLimits: {
    json: '10mb',
    urlencoded: '10mb'
  },
  
  // Health check configuration
  healthCheck: {
    enabled: true,
    endpoint: '/health'
  }
}
