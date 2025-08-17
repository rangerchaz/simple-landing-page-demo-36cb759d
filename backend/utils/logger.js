const fs = require('fs');
const path = require('path');

class Logger {
  constructor() {
    this.logLevel = process.env.LOG_LEVEL || 'info';
    this.logLevels = {
      error: 0,
      warn: 1,
      info: 2,
      debug: 3
    };
    
    // Create logs directory if it doesn't exist
    this.logDir = path.join(process.cwd(), 'logs');
    if (!fs.existsSync(this.logDir)) {
      fs.mkdirSync(this.logDir, { recursive: true });
    }
    
    // Log files
    this.errorLogFile = path.join(this.logDir, 'error.log');
    this.combinedLogFile = path.join(this.logDir, 'combined.log');
  }

  shouldLog(level) {
    return this.logLevels[level] <= this.logLevels[this.logLevel];
  }

  formatMessage(level, message, meta = {}) {
    const timestamp = new Date().toISOString();
    const metaString = Object.keys(meta).length > 0 ? JSON.stringify(meta) : '';
    
    return JSON.stringify({
      timestamp,
      level: level.toUpperCase(),
      message,
      ...(Object.keys(meta).length > 0 && { meta }),
      pid: process.pid,
      env: process.env.NODE_ENV || 'development'
    });
  }

  writeToFile(filename, content) {
    try {
      fs.appendFileSync(filename, content + '\n');
    } catch (error) {
      console.error('Failed to write to log file:', error.message);
    }
  }

  log(level, message, meta = {}) {
    if (!this.shouldLog(level)) {
      return;
    }

    const formattedMessage = this.formatMessage(level, message, meta);
    
    // Console output with colors
    const colors = {
      error: '\x1b[31m', // red
      warn: '\x1b[33m',  // yellow
      info: '\x1b[36m',  // cyan
      debug: '\x1b[32m'  // green
    };
    
    const resetColor = '\x1b[0m';
    const colorCode = colors[level] || '';
    
    console.log(`${colorCode}${formattedMessage}${resetColor}`);

    // File output
    this.writeToFile(this.combinedLogFile, formattedMessage);
    
    // Error logs also go to error file
    if (level === 'error') {
      this.writeToFile(this.errorLogFile, formattedMessage);
    }
  }

  error(message, meta = {}) {
    this.log('error', message, meta);
  }

  warn(message, meta = {}) {
    this.log('warn', message, meta);
  }

  info(message, meta = {}) {
    this.log('info', message, meta);
  }

  debug(message, meta = {}) {
    this.log('debug', message, meta);
  }

  // Method to clean old logs (optional)
  cleanOldLogs(maxAgeInDays = 30) {
    try {
      const files = fs.readdirSync(this.logDir);
      const maxAge = maxAgeInDays * 24 * 60 * 60 * 1000;
      
      files.forEach(file => {
        const filePath = path.join(this.logDir, file);
        const stats = fs.statSync(filePath);
        
        if (Date.now() - stats.mtime.getTime() > maxAge) {
          fs.unlinkSync(filePath);
          this.info(`Cleaned old log file: ${file}`);
        }
      });
    } catch (error) {
      this.error('Failed to clean old logs', { error: error.message });
    }
  }
}

// Create singleton instance
const logger = new Logger();

// Clean old logs on startup (optional)
// logger.cleanOldLogs(30);

module.exports = logger;