export const TRANSFER_NOTE_MAX_LEN = 200;

export function normalizeTransferNote(raw: unknown): string | undefined {
  if (typeof raw !== "string") {
    return undefined;
  }
  const t = raw.replace(/\s+/g, " ").trim();
  if (!t) {
    return undefined;
  }
  return t.length <= TRANSFER_NOTE_MAX_LEN ? t : t.slice(0, TRANSFER_NOTE_MAX_LEN);
}
