import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import http from 'http';
import { env } from './config/env';
import { checkMySQLConnection } from './db/mysql';
import { checkRedisConnection } from './redis/client';

const app = express();

app.use(helmet());
app.use(
  cors({
    origin: env.CLIENT_URL,
    credentials: true,
  })
);
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Health check endpoint for Phase 1 verification
app.get('/health', async (_req, res) => {
  const mysqlHealthy = await checkMySQLConnection();
  const redisHealthy = await checkRedisConnection();

  let elasticsearchHealthy = false;
  try {
    const esRes = await fetch(`${env.ELASTICSEARCH_URL}/_cluster/health`);
    elasticsearchHealthy = esRes.ok;
  } catch {
    elasticsearchHealthy = false;
  }

  const allHealthy = mysqlHealthy && redisHealthy && elasticsearchHealthy;

  return res.status(allHealthy ? 200 : 503).json({
    status: allHealthy ? 'ok' : 'degraded',
    services: {
      mysql: mysqlHealthy ? 'connected' : 'disconnected',
      redis: redisHealthy ? 'connected' : 'disconnected',
      elasticsearch: elasticsearchHealthy ? 'connected' : 'disconnected',
    },
    timestamp: new Date().toISOString(),
  });
});

const server = http.createServer(app);

if (process.env.NODE_ENV !== 'test') {
  server.listen(env.PORT, () => {
    console.log(`🚀 Server listening on port ${env.PORT} in ${env.NODE_ENV} mode`);
  });
}

export { app, server };
