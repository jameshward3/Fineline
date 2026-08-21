const E164_PHONE = /^\+[1-9]\d{7,14}$/;

/**
 * Normalize common North American input while preserving already-valid
 * international E.164 numbers. Extensions are intentionally not accepted for
 * SMS authentication.
 */
export function normalizePhoneNumber(input: string): string | null {
  const trimmed = input.trim();
  if (!trimmed) return null;

  if (trimmed.startsWith("+")) {
    const international = `+${trimmed.slice(1).replace(/\D/g, "")}`;
    return E164_PHONE.test(international) ? international : null;
  }

  const digits = trimmed.replace(/\D/g, "");
  if (digits.length === 10) return `+1${digits}`;
  if (digits.length === 11 && digits.startsWith("1")) return `+${digits}`;
  return null;
}

export function maskPhoneNumber(phone: string): string {
  const normalized = normalizePhoneNumber(phone);
  if (!normalized) return "your phone";
  const digits = normalized.slice(1);
  if (digits.length === 11 && digits.startsWith("1")) {
    return `(***) ***-${digits.slice(-4)}`;
  }
  return `+${digits.slice(0, Math.max(1, digits.length - 6))} ••• ••${digits.slice(-4)}`;
}

export function phoneLookupCandidates(input: string): string[] {
  const normalized = normalizePhoneNumber(input);
  if (!normalized) return [];
  const candidates = new Set([normalized]);
  const digits = normalized.slice(1);
  if (digits.length === 11 && digits.startsWith("1")) {
    const local = digits.slice(1);
    candidates.add(local);
    candidates.add(`${local.slice(0, 3)}-${local.slice(3, 6)}-${local.slice(6)}`);
    candidates.add(`(${local.slice(0, 3)}) ${local.slice(3, 6)}-${local.slice(6)}`);
  }
  return [...candidates];
}
