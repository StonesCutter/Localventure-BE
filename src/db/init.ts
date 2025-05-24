import { pool } from "../db";

/**
 * Ensures the required tables exist.
 * Run once on server start-up.
 */
export async function initDb() {
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

  // CITIES ------------------------------------------------------------
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

  // SPOTS -------------------------------------------------------------
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
}
