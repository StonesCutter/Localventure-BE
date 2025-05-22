import { prisma } from '../prisma';

export async function safeQuery<T = unknown>(
  query: string,
  values: any[] = [],
  retries = 3,
) {
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore
      return await prisma.$queryRawUnsafe<T>(query, ...values);
    } catch (err) {
      if (attempt === retries) throw err;
      console.warn(`[db] attempt ${attempt} failed, retrying…`);
      await new Promise(r => setTimeout(r, attempt * 2000)); // 2s, 4s
    }
  }
}
