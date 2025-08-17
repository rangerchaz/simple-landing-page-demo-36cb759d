const express = require('express');
const os = require('os');
const logger = require('../utils/logger');

const router = express.Router();

// GET /health - Health check endpoint
router.get('/health', (req, res) => {
  try {
    const healthData = {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      environment: process.env.NODE_ENV || 'development',
      version: process.env.npm_package_version || '1.0.0',
      system: {
        platform: os.platform(),
        arch: os.arch(),
        nodeVersion: process.version,
        memory: {
          used: Math.round(process.memoryUsage().heapUsed / 1024 / 1024 * 100) / 100,
          total: Math.round(process.memoryUsage().heapTotal / 1024 / 1024 * 100) / 100,
          external: Math.round(process.memoryUsage().external / 1024 / 1024 * 100) / 100
        },
        cpu: {
          loadAverage: os.loadavg(),
          cpuCount: os.cpus().length
        }
      },
      services: {
        email: {
          configured: !!(process.env.SMTP_HOST && process.env.SMTP_USER && process.env.ADMIN_EMAIL),
          host: process.env.SMTP_HOST || 'not configured'
        }
      }
    };

    // Log health check (only in development to avoid spam)
    if (process.env.NODE_ENV === 'development') {
      logger.info('Health check requested', {
        ip: req.ip,
        userAgent: req.get('User-Agent')
      });
    }

    res.status(200).json(healthData);
  } catch (error) {
    logger.error('Health check failed', {
      error: error.message,
      stack: error.stack
    });

    res.status(500).json({
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      error: 'Health check failed',
      message: error.message
    });
  }
});

// GET /health/simple - Simple health check for load balancers
router.get('/health/simple', (req, res) => {
  res.status(200).send('OK');
});

module.exports = router;