/**
 * A readable reason for a failed database call. Connecting to `localhost` can throw an
 * AggregateError whose `message` is empty (it tries both ::1 and 127.0.0.1), so fall back to `code`.
 */
export function describeError(error: unknown): string {
  if (!(error instanceof Error)) return String(error);
  const code = (error as NodeJS.ErrnoException).code;
  return error.message || code || error.name;
}
