import { createApp } from './app';
import { env } from './config/env';
import { logger } from './middleware/requestLogger';

const app = createApp();
const port = env.port || 8080;

app.listen(port, () => {
  logger.info({ port }, 'HTTP server started');
});


