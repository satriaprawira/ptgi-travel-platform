import type { TransformFnParams } from 'class-transformer';

/** Trims strings; anything else passes through for the validators to reject. */
export const trim = ({ value }: TransformFnParams): unknown =>
  typeof value === 'string' ? value.trim() : value;

/** Trims strings and turns an empty one into null, for optional text columns. */
export const trimToNull = ({ value }: TransformFnParams): unknown => {
  if (typeof value !== 'string') return value;
  const trimmed = value.trim();
  return trimmed === '' ? null : trimmed;
};
