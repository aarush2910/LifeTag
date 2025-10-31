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

export function isAuthenticated(): boolean {
  return !!getStoredUser();
  // return true;
}
