import React, { useEffect } from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { isAuthenticated, getStoredUser } from '../lib/auth';

/**
 * Completely blocks the browser Back button while the user is authenticated.
 *
 * HOW IT WORKS:
 *  1. On mount we call pushState() once to seed a "dummy" forward entry in the
 *     history stack. This gives the browser something to consume on Back press
 *     without leaving the current URL.
 *  2. We listen in the CAPTURE phase (before React Router's bubble-phase handler)
 *     so our handler fires first. We immediately call pushState() again to
 *     re-seed the dummy entry — by the time React Router sees the event the URL
 *     has already been reset, so it doesn't navigate anywhere.
 *  3. Empty dependency array → listener is registered once and stays for the
 *     whole authenticated session. Re-registering on every route change was
 *     creating gaps where a quick Back press could slip through.
 */
function useBlockBackButton() {
  useEffect(() => {
    // Seed the first dummy entry
    window.history.pushState(null, '', window.location.href);

    const block = () => {
      // Re-seed immediately — runs BEFORE React Router's popstate handler
      window.history.pushState(null, '', window.location.href);
    };

    // capture:true  →  our handler runs before React Router's bubble-phase handler
    window.addEventListener('popstate', block, { capture: true });
    return () => window.removeEventListener('popstate', block, { capture: true });
  }, []); // empty deps: attach once, never remove during the session
}

export function ProtectedRoute() {
  const location = useLocation();
  useBlockBackButton();

  if (!isAuthenticated()) {
    return <Navigate to={getLoginForRole()} replace state={{ from: location }} />;
  }
  return <Outlet />;
}

type RoleProtectedRouteProps = {
  allowedRoles: string[];
};

export function RoleProtectedRoute({ allowedRoles }: RoleProtectedRouteProps) {
  const location = useLocation();
  if (!isAuthenticated()) {
    return <Navigate to={getLoginForRole()} replace state={{ from: location }} />;
  }
  const user = getStoredUser();
  const role = (user?.role || "").toLowerCase();
  const normalizedAllowed = allowedRoles.map((r) => r.toLowerCase());
  if (!normalizedAllowed.includes(role)) {
    return <Navigate to={getDashboardForRole()} replace />;
  }
  return <Outlet />;
}

function getDashboardForRole(): string {
  const user = getStoredUser();
  const role = user?.role?.toLowerCase();
  if (role === 'vet') return '/vet-dashboard';
  if (role === 'shelter') return '/shelter-dashboard';
  return '/dashboard'; // farmer
}

/** Returns the correct login page for the current stored role (used on session expiry). */
function getLoginForRole(): string {
  try {
    const raw = localStorage.getItem('user');
    if (!raw) return '/login';
    const parsed = JSON.parse(raw);
    const role = (parsed?.role || '').toLowerCase();
    if (role === 'vet') return '/vet/login';
    if (role === 'shelter') return '/shelter/login';
    // For farmers: check if they logged in via INAPH ID or Aadhaar
    if (role === 'farmer') {
      const usedInaph = parsed?.inaph_id || localStorage.getItem('inaph_id');
      return usedInaph ? '/InaphLogin' : '/login';
    }
  } catch { /* ignore */ }
  return '/login';
}

export function PublicOnlyRoute() {
  // Redirect any authenticated user away from ALL public-only pages.
  // We no longer clear auth storage on login/dialog mount, so this is safe.
  if (isAuthenticated()) {
    return <Navigate to={getDashboardForRole()} replace />;
  }
  return <Outlet />;
}

/**
 * Drop this on the Home route so logged-in users are sent straight
 * to their dashboard instead of seeing the landing page.
 */
export function AuthRedirect({ children }: { children: React.ReactNode }) {
  if (isAuthenticated()) {
    return <Navigate to={getDashboardForRole()} replace />;
  }
  return <>{children}</>;
}
