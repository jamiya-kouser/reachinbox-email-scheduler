import { router } from './routes';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import http from 'http';
import session from 'express-session';
import { RedisStore } from 'connect-redis';
import { env } from './config/env';
import { checkMySQLConnection } from './db/mysql';
import { emailQueue } from './queues/emailQueue';
import { checkRedisConnection, redis } from './redis/client';
import { passport } from './auth';

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

app.use(
  session({
    store: new RedisStore({ client: redis }),
    secret: env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      secure: env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 1000 * 60 * 60 * 24 * 7,
    },
  })
);

app.use(passport.initialize());
app.use(passport.session());
app.use(router);

app.get('/api/v1/auth/google', passport.authenticate('google', {
  scope: ['profile', 'email'],
}));

app.get(
  '/api/v1/auth/google/callback',
  passport.authenticate('google', {
    failureRedirect: `${env.CLIENT_URL}/login?error=google_auth_failed`,
  }),
  (_req, res) => {
    res.redirect(env.CLIENT_URL);
  }
);

app.get('/api/v1/auth/me', (req, res) => {
  if (!req.isAuthenticated()) {
    return res.status(401).json({
      authenticated: false,
    });
  }

  return res.json({
    authenticated: true,
    user: req.user,
  });
});

app.post('/api/v1/auth/logout', (req, res, next) => {
  req.logout((error) => {
    if (error) {
      return next(error);
    }

    req.session.destroy((sessionError) => {
      if (sessionError) {
        return next(sessionError);
      }

      res.clearCookie('connect.sid');
      return res.status(204).send();
    });
  });
});

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
    console.log(`📬 Email queue "${emailQueue.name}" initialized`);
  });
}

export { app, server };