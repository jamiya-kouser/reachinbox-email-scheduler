import passport from 'passport';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import { env } from './config/env';
import { pool } from './db/mysql';
import { randomUUID } from 'crypto';

export interface AuthUser {
  id: string;
  googleId: string;
  email: string;
  name: string | null;
  avatarUrl: string | null;
}

passport.use(
  new GoogleStrategy(
    {
      clientID: env.GOOGLE_CLIENT_ID,
      clientSecret: env.GOOGLE_CLIENT_SECRET,
      callbackURL: env.GOOGLE_CALLBACK_URL,
    },
    async (_accessToken, _refreshToken, profile, done) => {
      try {
        const email = profile.emails?.[0]?.value;

        if (!email) {
          return done(new Error('Google account did not provide an email address'));
        }

        const googleId = profile.id;
        const name = profile.displayName || null;
        const avatarUrl = profile.photos?.[0]?.value || null;

        const [rows] = await pool.execute<any[]>(
          `SELECT id, google_id, email, name, avatar_url
           FROM users
           WHERE google_id = ?
           LIMIT 1`,
          [googleId]
        );

        if (rows[0]) {
          const user = rows[0];

          await pool.execute(
            `UPDATE users
             SET email = ?, name = ?, avatar_url = ?
             WHERE id = ?`,
            [email, name, avatarUrl, user.id]
          );

          return done(null, {
            id: user.id,
            googleId: user.google_id,
            email,
            name,
            avatarUrl,
          } satisfies AuthUser);
        }

        const id = randomUUID();

        await pool.execute(
          `INSERT INTO users (
            id,
            google_id,
            email,
            name,
            avatar_url
          )
          VALUES (?, ?, ?, ?, ?)`,
          [id, googleId, email, name, avatarUrl]
        );

        return done(null, {
          id,
          googleId,
          email,
          name,
          avatarUrl,
        } satisfies AuthUser);
      } catch (error) {
        return done(error);
      }
    }
  )
);

passport.serializeUser((user, done) => {
  const authUser = user as AuthUser;
  done(null, authUser.id);
});

passport.deserializeUser(async (id, done) => {
  try {
    const [rows] = await pool.execute<any[]>(
      `SELECT id, google_id, email, name, avatar_url
       FROM users
       WHERE id = ?
       LIMIT 1`,
      [id as string]
    );

    if (!rows[0]) {
      return done(null, false);
    }

    const user = rows[0];

    return done(null, {
      id: user.id,
      googleId: user.google_id,
      email: user.email,
      name: user.name,
      avatarUrl: user.avatar_url,
    } satisfies AuthUser);
  } catch (error) {
    return done(error);
  }
});

export { passport };