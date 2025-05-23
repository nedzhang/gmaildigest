
import pino from 'pino';
import fs from 'fs';
import path from 'path';
import { multistream } from 'pino';

const isDev = process.env.NODE_ENV !== 'production';

const logDir = path.join(process.cwd(), 'logs');
if (!fs.existsSync(logDir)) fs.mkdirSync(logDir);
const logFilePath = path.join(logDir, 'app.log');


const streams = isDev
  ? multistream([ // Streams: pretty to console, raw JSON to file for DEV 
      { stream: pino.transport({
          target: 'pino-pretty',
          options: { colorize: true }
        }) },
      { stream: pino.destination({ dest: logFilePath, sync: false }) }
    ])
  : pino.destination({ dest: logFilePath, sync: false }); // Raw JSON to file for PROD

const logger = pino({
    level: process.env.NODE_ENV === 'production' ? 'info' : 'debug',
}, streams);

export default logger;
