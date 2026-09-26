import { pool } from './mysql';

export async function runMigrations() {
  console.log('🔄 Running initial MySQL migrations...');
  const connection = await pool.getConnection();

  try {
    await connection.beginTransaction();

    // 1. users
    await connection.query(`
      CREATE TABLE IF NOT EXISTS users (
        id VARCHAR(36) PRIMARY KEY,
        google_id VARCHAR(255) NOT NULL UNIQUE,
        email VARCHAR(255) NOT NULL UNIQUE,
        name VARCHAR(255) NULL,
        avatar_url TEXT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);

    // 2. senders
    await connection.query(`
      CREATE TABLE IF NOT EXISTS senders (
        id VARCHAR(36) PRIMARY KEY,
        user_id VARCHAR(36) NOT NULL,
        email VARCHAR(255) NOT NULL,
        display_name VARCHAR(255) NULL,
        smtp_host VARCHAR(255) NOT NULL,
        smtp_port INT NOT NULL DEFAULT 587,
        smtp_user VARCHAR(255) NOT NULL,
        smtp_pass VARCHAR(255) NOT NULL,
        hourly_quota INT NOT NULL DEFAULT 200,
        min_delay_ms INT NOT NULL DEFAULT 2000,
        is_active BOOLEAN NOT NULL DEFAULT TRUE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        CONSTRAINT fk_senders_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
        INDEX idx_senders_user (user_id)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);

    // 3. email_batches
    await connection.query(`
      CREATE TABLE IF NOT EXISTS email_batches (
        id VARCHAR(36) PRIMARY KEY,
        user_id VARCHAR(36) NOT NULL,
        sender_id VARCHAR(36) NOT NULL,
        name VARCHAR(255) NOT NULL,
        total_count INT NOT NULL DEFAULT 0,
        sent_count INT NOT NULL DEFAULT 0,
        failed_count INT NOT NULL DEFAULT 0,
        rescheduled_count INT NOT NULL DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT fk_batches_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
        CONSTRAINT fk_batches_sender FOREIGN KEY (sender_id) REFERENCES senders(id) ON DELETE RESTRICT,
        INDEX idx_batches_user (user_id)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);

    // 4. emails
    await connection.query(`
      CREATE TABLE IF NOT EXISTS emails (
        id VARCHAR(36) PRIMARY KEY,
        user_id VARCHAR(36) NOT NULL,
        sender_id VARCHAR(36) NOT NULL,
        batch_id VARCHAR(36) NULL,
        recipient_email VARCHAR(255) NOT NULL,
        recipient_name VARCHAR(255) NULL,
        subject VARCHAR(500) NOT NULL,
        body_text TEXT NOT NULL,
        status ENUM('PENDING', 'QUEUED', 'PROCESSING', 'SENT', 'RESCHEDULED', 'FAILED', 'CANCELLED') NOT NULL DEFAULT 'PENDING',
        scheduled_for DATETIME NOT NULL,
        sent_at DATETIME NULL,
        bull_job_id VARCHAR(255) NULL UNIQUE,
        idempotency_key VARCHAR(255) NOT NULL UNIQUE,
        attempts INT NOT NULL DEFAULT 0,
        max_attempts INT NOT NULL DEFAULT 3,
        last_error TEXT NULL,
        smtp_message_id VARCHAR(255) NULL,
        ethereal_preview_url TEXT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        CONSTRAINT fk_emails_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
        CONSTRAINT fk_emails_sender FOREIGN KEY (sender_id) REFERENCES senders(id) ON DELETE RESTRICT,
        CONSTRAINT fk_emails_batch FOREIGN KEY (batch_id) REFERENCES email_batches(id) ON DELETE SET NULL,
        INDEX idx_user_status (user_id, status),
        INDEX idx_sender_scheduled (sender_id, scheduled_for),
        INDEX idx_status_scheduled (status, scheduled_for)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);

    // 5. slack_connections
    await connection.query(`
      CREATE TABLE IF NOT EXISTS slack_connections (
        id VARCHAR(36) PRIMARY KEY,
        user_id VARCHAR(36) NOT NULL UNIQUE,
        team_id VARCHAR(255) NOT NULL,
        team_name VARCHAR(255) NOT NULL,
        channel_id VARCHAR(255) NOT NULL,
        channel_name VARCHAR(255) NOT NULL,
        webhook_url TEXT NOT NULL,
        access_token TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        CONSTRAINT fk_slack_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);

    await connection.commit();
    console.log('✅ Migrations completed successfully.');
  } catch (err) {
    await connection.rollback();
    console.error('❌ Migration failed:', err);
    throw err;
  } finally {
    connection.release();
  }
}

if (require.main === module) {
  runMigrations()
    .then(() => process.exit(0))
    .catch(() => process.exit(1));
}
