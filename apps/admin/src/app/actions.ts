'use server';

import type { Logger } from 'winston';
import {createLogger, format, transports} from 'winston';

const {combine, timestamp, json} = format;

const log: Logger =  createLogger({
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

export async function logger(): Promise<Logger> {
    return new Promise(resolve => {resolve(log)});
}
