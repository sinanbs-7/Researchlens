import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import pg from 'pg';
import { PGlite } from '@electric-sql/pglite';
import { config } from './env.js';
import { logger } from '../utils/logger.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

let dbClient = null;
let isPgLite = false;

export async function initDatabase() {
  if (dbClient) return dbClient;

  if (config.DATABASE_URL && config.DATABASE_URL.trim() !== '') {
    logger.info('[Database] Connecting to PostgreSQL via DATABASE_URL...');
    const pool = new pg.Pool({
      connectionString: config.DATABASE_URL,
      ssl: config.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
    });

    const res = await pool.query('SELECT NOW() as current_time');
    logger.info(`[Database] Connected to external PostgreSQL successfully. Server time: ${res.rows[0].current_time}`);

    dbClient = {
      query: async (text, params) => pool.query(text, params),
      exec: async (text) => pool.query(text),
      close: async () => pool.end()
    };
    isPgLite = false;
  } else {
    logger.info(`[Database] Initializing persistent PostgreSQL database at ${config.DATA_DIR}...`);

    try {
      if (!fs.existsSync(config.DATA_DIR)) {
        fs.mkdirSync(config.DATA_DIR, { recursive: true });
      }

      const pglite = new PGlite(config.DATA_DIR);
      await pglite.waitReady;
      logger.info('[Database] Persistent PostgreSQL (PGlite) engine is online.');

      dbClient = {
        query: async (text, params) => {
          const res = await pglite.query(text, params);
          return {
            rows: res.rows || [],
            rowCount: res.affectedRows ?? (res.rows ? res.rows.length : 0)
          };
        },
        exec: async (text) => pglite.exec(text),
        close: async () => pglite.close()
      };
      isPgLite = true;
    } catch (fsErr) {
      logger.warn(`[Database] File-backed PostgreSQL encountered: ${fsErr.message}. Starting high-speed in-memory PostgreSQL engine...`);
      const pglite = new PGlite();
      await pglite.waitReady;
      logger.info('[Database] In-memory PostgreSQL engine initialized successfully.');

      dbClient = {
        query: async (text, params) => {
          const res = await pglite.query(text, params);
          return {
            rows: res.rows || [],
            rowCount: res.affectedRows ?? (res.rows ? res.rows.length : 0)
          };
        },
        exec: async (text) => pglite.exec(text),
        close: async () => pglite.close()
      };
      isPgLite = true;
    }
  }

  // Run schema migrations
  await runMigrations();

  return dbClient;
}

async function runMigrations() {
  try {
    const schemaPath = path.resolve(__dirname, '../../../database/schema.sql');
    if (fs.existsSync(schemaPath)) {
      logger.info('[Database] Running schema migrations...');
      const schemaSql = fs.readFileSync(schemaPath, 'utf-8');
      await dbClient.exec(schemaSql);
      logger.info('[Database] Schema migrations applied successfully.');
    } else {
      logger.warn(`[Database] Migration schema file not found at ${schemaPath}`);
    }
  } catch (err) {
    logger.error('[Database] Migration error:', err.message);
    throw err;
  }
}

export function getDb() {
  if (!dbClient) {
    throw new Error('Database has not been initialized. Call initDatabase() first.');
  }
  return dbClient;
}

export { isPgLite };
