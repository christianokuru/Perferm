/**
 * PBKDF2-SHA256 password hashing via WebCrypto.
 * Used only by the demo auth adapter; Supabase Auth replaces this in production.
 */
const ITERATIONS = 210_000;
const encoder = new TextEncoder();

function toHex(buffer: ArrayBuffer | Uint8Array): string {
  return Array.from(buffer instanceof Uint8Array ? buffer : new Uint8Array(buffer))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

function fromHex(hex: string): Uint8Array<ArrayBuffer> {
  const bytes = new Uint8Array(hex.length / 2);
  for (let i = 0; i < bytes.length; i++) bytes[i] = parseInt(hex.slice(i * 2, i * 2 + 2), 16);
  return bytes;
}

export function createSalt(): string {
  const salt = new Uint8Array(16);
  crypto.getRandomValues(salt);
  return toHex(salt);
}

export async function hashPassword(password: string, saltHex: string): Promise<string> {
  const key = await crypto.subtle.importKey("raw", encoder.encode(password), "PBKDF2", false, ["deriveBits"]);
  const bits = await crypto.subtle.deriveBits(
    { name: "PBKDF2", hash: "SHA-256", salt: fromHex(saltHex), iterations: ITERATIONS },
    key,
    256,
  );
  return toHex(bits);
}

/** Constant-time comparison so response timing doesn't leak hash prefixes. */
export function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

export async function verifyPassword(password: string, saltHex: string, expectedHash: string): Promise<boolean> {
  return timingSafeEqual(await hashPassword(password, saltHex), expectedHash);
}
