import { pool } from '../db';

export async function safeQuery<T = unknown>(
  query: string,
  values: any[] = [],
  retries = 3,
) {
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      const result = await pool.query(query, values);
      return result.rows as T;
    } catch (err) {
      if (attempt === retries) throw err;
      console.warn(`[db] attempt ${attempt} failed, retrying…`);
      await new Promise(r => setTimeout(r, attempt * 2000)); // 2s, 4s
    }
  }
}
