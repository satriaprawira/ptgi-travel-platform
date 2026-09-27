/**
 * Builds the SET clause of a partial UPDATE. Column names come only from the code-side `columns`
 * whitelist; values always go in as parameters, starting at $1. A key that is `undefined` in
 * `patch` is left alone, while `null` sets the column to NULL.
 */
export function buildSetClause<T extends object>(
  patch: T,
  columns: { [K in keyof T]?: string },
): { sql: string; values: unknown[] } {
  const assignments: string[] = [];
  const values: unknown[] = [];

  for (const [key, column] of Object.entries(columns) as [keyof T, string][]) {
    const value = patch[key];
    if (value === undefined) continue;
    values.push(value);
    assignments.push(`${column} = $${values.length}`);
  }

  return { sql: assignments.join(', '), values };
}
