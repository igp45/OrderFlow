import { Navigate, useLocation } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { authApi } from '../lib/api';

interface Props {
  allowedRoles: ('admin' | 'kitchen')[];
  children: React.ReactNode;
}

export function setSessionRole(role: string) {
  try { sessionStorage.setItem('of_role', role); } catch { /* ignore */ }
}
export function clearSessionRole() {
  try { sessionStorage.removeItem('of_role'); } catch { /* ignore */ }
}
function getSessionRole(): string | null {
  try { return sessionStorage.getItem('of_role'); } catch { return null; }
}

export default function ProtectedRoute({ allowedRoles, children }: Props) {
  const location = useLocation();
  const sessionRole = getSessionRole();

  // Only hit the network when there is NO session (e.g. direct URL visit, fresh browser).
  // After login, sessionRole is always set so this query is disabled entirely —
  // meaning a slow/failing backend can never redirect the user back to login.
  const { data, isLoading } = useQuery({
    queryKey: ['auth'],
    queryFn: authApi.me,
    retry: 1,
    retryDelay: 3000,
    staleTime: Infinity,
    enabled: !sessionRole,
  });

  // ── Fast path ── session says who you are; render immediately, zero network ──
  if (sessionRole) {
    if (allowedRoles.includes(sessionRole as 'admin' | 'kitchen')) {
      return <>{children}</>;
    }
    // Kitchen staff trying to hit /admin (or vice versa)
    return <Navigate to="/login" state={{ from: location.pathname }} replace />;
  }

  // ── Slow path ── no session, waiting for the cookie-based check ──
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: 'var(--bg)' }}>
        <div className="w-10 h-10 border-4 rounded-full animate-spin"
          style={{ borderColor: 'var(--border)', borderTopColor: 'var(--accent)' }} />
      </div>
    );
  }

  if (!data || !allowedRoles.includes(data.role as 'admin' | 'kitchen')) {
    return <Navigate to="/login" state={{ from: location.pathname }} replace />;
  }

  return <>{children}</>;
}
