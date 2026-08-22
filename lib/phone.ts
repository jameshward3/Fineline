/** Normalizes to bare digits, dropping a US/Canada country-code prefix, so
 * "(555) 123-4567", "555-123-4567", and "+1 555 123 4567" all compare equal. */
export function normalizePhone(input: string): string {
  const digits = input.replace(/\D/g, "");
  return digits.length === 11 && digits.startsWith("1") ? digits.slice(1) : digits;
}
