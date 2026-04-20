const winston = require('winston');
const { combine, timestamp, printf, colorize, json } = winston.format;

// Define log format
const logFormat = printf(({ level, message, timestamp, ...meta }) => {
  const metaString = Object.keys(meta).length ? `\n${JSON.stringify(meta, null, 2)}` : '';
  return `${timestamp} [${level}]: ${message}${metaString}`;
});

// Create logger instance
const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: combine(
    timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    colorize(),
    logFormat
  ),
  transports: [
    // Console transport
    new winston.transports.Console(),
    // File transport for errors
    new winston.transports.File({ 
      filename: 'logs/error.log', 
      level: 'error',
      format: combine(timestamp(), json()) 
    }),
    // File transport for all logs
    new winston.transports.File({ 
      filename: 'logs/combined.log',
      format: combine(timestamp(), json())
    })
  ],
  exceptionHandlers: [
    new winston.transports.File({ filename: 'logs/exceptions.log' })
  ],
  rejectionHandlers: [
    new winston.transports.File({ filename: 'logs/rejections.log' })
  ]
});

// Create logs directory if it doesn't exist
const fs = require('fs');
const logDir = 'logs';
if (!fs.existsSync(logDir)) {
  fs.mkdirSync(logDir);
}

module.exports = logger;
