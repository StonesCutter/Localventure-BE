import { pool } from "../db";
import { logger } from "../utils/logger"; // Assuming logger is available here

/**
 * Ensures the required tables exist.
 * Run once on server start-up.
 */
export async function initDb() {
  console.log('[CONSOLE_LOG][initDb] Entered initDb function.'); // RAW CONSOLE LOG
  logger.info('[initDb] Starting database initialization process...');

  try {
    logger.info('[initDb] Attempting to create "users" table IF NOT EXISTS...');
  // USERS -------------------------------------------------------------
  await pool.query(`
    CREATE TABLE IF NOT EXISTS users (
      id          SERIAL PRIMARY KEY,
      username    TEXT UNIQUE NOT NULL,
      email       TEXT UNIQUE NOT NULL,
      created_at  TIMESTAMPTZ DEFAULT NOW(),
      updated_at  TIMESTAMPTZ DEFAULT NOW()
    );
  `);
    logger.info('[initDb] "users" table creation/verification successful.');

  // CITIES ------------------------------------------------------------
    logger.info('[initDb] Attempting to create "cities" table IF NOT EXISTS...');
  await pool.query(`
    CREATE TABLE IF NOT EXISTS cities (
      id          SERIAL PRIMARY KEY,
      name        TEXT NOT NULL,
      country     TEXT NOT NULL,
      latitude    DOUBLE PRECISION,
      longitude   DOUBLE PRECISION,
      created_at  TIMESTAMPTZ DEFAULT NOW(),
      updated_at  TIMESTAMPTZ DEFAULT NOW()
    );
  `);
    logger.info('[initDb] "cities" table creation/verification successful.');

  // SPOTS -------------------------------------------------------------
    logger.info('[initDb] Attempting to create "spots" table IF NOT EXISTS...');
  await pool.query(`
    CREATE TABLE IF NOT EXISTS spots (
      id          SERIAL PRIMARY KEY,
      name        TEXT NOT NULL,
      city_id     INTEGER REFERENCES cities(id) ON DELETE CASCADE,
      description TEXT,
      latitude    DOUBLE PRECISION,
      longitude   DOUBLE PRECISION,
      created_at  TIMESTAMPTZ DEFAULT NOW(),
      updated_at  TIMESTAMPTZ DEFAULT NOW()
    );
  `);
    logger.info('[initDb] "spots" table creation/verification successful.');
    logger.info('[initDb] All tables initialized successfully.');

  } catch (error) {
    console.error('[CONSOLE_LOG][initDb] CRITICAL ERROR during table creation:', error); // RAW CONSOLE LOG
    logger.error({ err: error }, '[initDb] CRITICAL ERROR during table creation.');
    throw error; // Re-throw to be caught by the caller in index.ts
  }
}
