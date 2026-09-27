import { Injectable, Logger, OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Pool, type PoolClient, type QueryResult, type QueryResultRow } from 'pg';
import type { EnvironmentVariables } from '../config/env.validation.js';
import { describeError } from './describe-error.js';

/** Runs one parameterized statement: satisfied by DatabaseService and by a transaction's PoolClient. */
export interface Queryable {
  query<T extends QueryResultRow = QueryResultRow>(text: string, params?: unknown[]): Promise<QueryResult<T>>;
}

@Injectable()
export class DatabaseService implements OnModuleDestroy, Queryable {
  private readonly logger = new Logger(DatabaseService.name);
  private readonly pool: Pool;

  constructor(config: ConfigService<EnvironmentVariables, true>) {
    this.pool = new Pool({
      connectionString: config.get('DATABASE_URL', { infer: true }),
      max: 10,
    });

    // The server can drop an idle client (Neon closes idle connections). Without a listener
    // that 'error' event is unhandled and would crash the process.
    this.pool.on('error', (error) => {
      this.logger.error(`Idle database client error: ${describeError(error)}`);
    });
  }

  /** Run one parameterized statement. Values go in `params` ($1, $2, ...), never into `text`. */
  query<T extends QueryResultRow = QueryResultRow>(
    text: string,
    params: unknown[] = [],
  ): Promise<QueryResult<T>> {
    return this.pool.query<T>(text, params);
  }

  /** Run `work` inside BEGIN/COMMIT on a single connection; any throw rolls back. */
  async transaction<T>(work: (client: PoolClient) => Promise<T>): Promise<T> {
    const client = await this.pool.connect();
    let discardClient = false;

    try {
      await client.query('BEGIN');
      const result = await work(client);
      await client.query('COMMIT');
      return result;
    } catch (error) {
      try {
        await client.query('ROLLBACK');
      } catch {
        // The connection itself is broken, so don't hand it back to the pool.
        discardClient = true;
      }
      throw error;
    } finally {
      client.release(discardClient);
    }
  }

  async onModuleDestroy(): Promise<void> {
    await this.pool.end();
  }
}
