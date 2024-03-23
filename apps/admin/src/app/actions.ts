'use server';

import * as winston from 'winston';
import type { Logger } from 'winston';

const log: Logger =  winston.createLogger({
    level: 'info',
    format: winston.format.json(),
    defaultMeta: { service: 'user-service' },
    transports: [
        new winston.transports.Console({
            format: winston.format.json(),
        })
    ],
});

export function logger(): Logger {
    return log;
}
