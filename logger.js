const path = require('path');
const { createLogger, format, transports } = require('winston');

const logger = createLogger({
    level: process.env.NODE_ENV === 'prod' ? 'warn' : 'debug',
    format: format.combine(
        format.label({ label: path.basename(__filename) }), // Logs filename
        format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
        format.printf(({ timestamp, level, message, label }) => {
            return `[${timestamp}] [${label}] ${level}: ${message}`;
        })
    ),
    transports: [
        new transports.File({ filename: 'logs/error.log', level: 'error' }),
        new transports.File({ filename: 'logs/combined.log' }),
    ],
});

if (process.env.NODE_ENV !== 'prod') {
    logger.add(new transports.Console());
}

module.exports = logger;