import express from 'express';
import { json } from 'body-parser';
import { setRoutes } from './routes/callRoutes';
import { deepgramClient } from './services/deepgramService';
import { twilioClient } from './services/twilioService';
import { logger } from './utils/logger';
import { PORT } from './config/index';

const app = express();

app.use(json());

setRoutes(app);

app.listen(PORT, () => {
    logger.info(`Server is running on port ${PORT}`);
    logger.info('Connected to Twilio and Deepgram services');
});