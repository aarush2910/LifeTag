export type AuthUser = {
  user_id?: string | number;
  user_name?: string;
  role?: string;
};

export function getStoredUser(): AuthUser | null {
  try {
    const raw = localStorage.getItem('user');
    if (!raw) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

/** Decode a JWT without verifying signature — just to read the `exp` claim. */
function getTokenExpiry(token: string): number | null {
  try {
    const payload = token.split('.')[1];
    if (!payload) return null;
    const decoded = JSON.parse(atob(payload.replace(/-/g, '+').replace(/_/g, '/')));
    return typeof decoded.exp === 'number' ? decoded.exp : null;
  } catch {
    return null;
  }
}

/** Clear all auth-related keys from localStorage. */
export function clearAuthStorage(): void {
  [
    'user', 'access_token', 'token', 'role', 'user_id',
    'farmerId', 'vet_id', 'shelter_id', 'inaph_id',
    'user_name', 'identifier', 'faadhar', 'vemail', 'semail',
  ].forEach((k) => localStorage.removeItem(k));
}

/**
 * Returns true only when there is a stored user AND the JWT token
 * is present and not yet expired.
 */
export function isAuthenticated(): boolean {
  const user = getStoredUser();
  if (!user) return false;

  const token = localStorage.getItem('access_token') || localStorage.getItem('token');
  if (!token) {
    // No token stored — treat session as invalid and clean up.
    clearAuthStorage();
    return false;
  }

  const exp = getTokenExpiry(token);
  if (exp !== null && Date.now() / 1000 > exp) {
    // Token has expired — wipe stale session so the user lands on /login.
    clearAuthStorage();
    return false;
  }

  return true;
}
