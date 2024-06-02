import winston from 'winston';
import DailyRotateFile from 'winston-daily-rotate-file';

const logConfiguration = {
    transports: [
        new winston.transports.Console({
            level: 'debug', // Ensure the debug level is available
            format: winston.format.combine(
                winston.format.colorize(),
                winston.format.simple()
            )
        }),
        new DailyRotateFile({
            level: 'info',
            filename: './logs/server-%DATE%.log',
            datePattern: 'YYYY-MM-DD',
            zippedArchive: true,
            maxSize: '20m',
            maxFiles: '14d',
            format: winston.format.combine(
                winston.format.timestamp(),
                winston.format.json()
            )
        })
    ],
    format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.printf(({ timestamp, level, message }) => {
            return `${timestamp} ${level}: ${message}`;
        })
    )
};

const logger = winston.createLogger(logConfiguration);

export default logger;
