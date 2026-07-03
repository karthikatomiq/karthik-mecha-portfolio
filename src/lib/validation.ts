const GMAIL_RE = /^[^\s@]+@gmail\.com$/i;

export function isGmailAddress(value: string): boolean {
  return GMAIL_RE.test(value.trim());
}
