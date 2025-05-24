import { Pool } from "pg";

const connectionString = process.env.DATABASE_URL;   // Neon uses a single URL
if (!connectionString) {
  console.warn(
    "[db] Warning: DATABASE_URL missing – falling back to individual PG* vars"
  );
}

export const pool = new Pool(
  connectionString
    ? {
        connectionString,
        ssl: { rejectUnauthorized: false }, // Neon requires SSL
      }
    : {
        host: process.env.PGHOST ?? "localhost",
        port: +(process.env.PGPORT ?? 5432),
        user: process.env.PGUSER ?? "postgres",
        password: process.env.PGPASSWORD ?? "postgres",
        database: process.env.PGDATABASE ?? "postgres",
      }
);
