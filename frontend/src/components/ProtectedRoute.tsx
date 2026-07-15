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

  // Background network check — validates the cookie is still alive.
  // We don't block rendering on this; sessionStorage provides the fast path.
  const { data, isLoading, isError } = useQuery({
    queryKey: ['auth'],
    queryFn: authApi.me,
    retry: 1,
    retryDelay: 3000,
    staleTime: 5 * 60 * 1000,
  });

  const role = data?.role ?? sessionRole;

  // If the network confirmed the session is invalid, clear and redirect
  if (isError && !isLoading) {
    clearSessionRole();
    return <Navigate to="/login" state={{ from: location.pathname }} replace />;
  }

  // No session at all and still loading — show spinner
  if (!sessionRole && isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: 'var(--bg)' }}>
        <div className="w-10 h-10 border-4 rounded-full animate-spin"
          style={{ borderColor: 'var(--border)', borderTopColor: 'var(--accent)' }} />
      </div>
    );
  }

  if (!role || !allowedRoles.includes(role as 'admin' | 'kitchen')) {
    return <Navigate to="/login" state={{ from: location.pathname }} replace />;
  }

  return <>{children}</>;
}
