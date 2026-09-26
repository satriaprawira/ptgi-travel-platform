import { DatabaseError } from 'pg';

export const PgErrorCode = {
  ForeignKeyViolation: '23503',
  UniqueViolation: '23505',
} as const;

/** True when `error` is a Postgres error with this SQLSTATE and, if given, this constraint name. */
export function isPgError(error: unknown, code: string, constraint?: string): error is DatabaseError {
  return (
    error instanceof DatabaseError &&
    error.code === code &&
    (constraint === undefined || error.constraint === constraint)
  );
}
