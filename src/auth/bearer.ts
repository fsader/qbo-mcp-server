import { timingSafeEqual } from "node:crypto";

/**
 * Constant-time check of an `Authorization: Bearer <token>` header against the
 * expected token.
 *
 * Returns false when either side is empty or the value does not match. The
 * comparison is constant-time once lengths match, so it does not leak the token
 * via timing. (Length itself is not secret-sensitive here.)
 */
export function checkBearer(
  authorizationHeader: string | undefined,
  expectedToken: string
): boolean {
  if (!expectedToken || !authorizationHeader) {
    return false;
  }

  const prefix = "Bearer ";
  if (!authorizationHeader.startsWith(prefix)) {
    return false;
  }

  const provided = Buffer.from(authorizationHeader.slice(prefix.length));
  const expected = Buffer.from(expectedToken);

  if (provided.length !== expected.length) {
    return false;
  }

  return timingSafeEqual(provided, expected);
}
