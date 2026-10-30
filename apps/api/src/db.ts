import pg from 'pg'; import { config } from './config.js';
export const db = new pg.Pool({connectionString: config.databaseUrl});
export async function tx<T>(fn:(c:pg.PoolClient)=>Promise<T>) { const c=await db.connect(); try {await c.query('BEGIN'); const r=await fn(c); await c.query('COMMIT'); return r;} catch(e){await c.query('ROLLBACK');throw e;} finally {c.release();} }
