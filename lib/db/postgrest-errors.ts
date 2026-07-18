export type PostgrestErrorLike = {
  code?: string;
  message?: string;
  details?: string;
} | null;

/** Match Postgres/PostgREST missing-column errors without treating other DB failures as compatible. */
export function isMissingPostgrestColumn(
  error: PostgrestErrorLike,
  column: string,
): boolean {
  if (!error || (error.code !== "PGRST204" && error.code !== "42703")) return false;
  const text = `${error.message ?? ""} ${error.details ?? ""}`.toLowerCase();
  return text.includes(column.toLowerCase());
}
