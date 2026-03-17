import { Pool } from 'pg';

let pool: Pool | undefined;

export function getPool(): Pool {
  if (!pool) {
    const connectionString =
      process.env.POSTGRES_URL || 'postgres://temporal_demo:temporal_demo@postgres:5432/temporal_demo';
    pool = new Pool({ connectionString });
  }
  return pool;
}

