import type { Logger } from 'winston';
import {createLogger, format, transports} from 'winston';

const {combine, timestamp, json} = format;

export const logger: Logger =  createLogger({
    level: 'info',
    format: combine(
        timestamp(),
        json(),
    ),
    defaultMeta: { service: 'admin' },
    transports: [
        new transports.Console(),
    ],
});
