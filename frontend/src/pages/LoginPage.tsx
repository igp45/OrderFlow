import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { authApi } from '../lib/api';
import DarkModeToggle from '../components/DarkModeToggle';

const ROLES = [
  {
    id: 'kitchen',
    label: 'Kitchen Staff',
    icon: '👨‍🍳',
    desc: 'Manage live orders & update status',
  },
  {
    id: 'admin',
    label: 'Admin Dashboard',
    icon: '📊',
    desc: 'Revenue, menu management & analytics',
  },
];

export default function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const queryClient = useQueryClient();
  const from = (location.state as { from?: string })?.from || null;

  const [selectedRole, setSelectedRole] = useState<string | null>(
    from === '/kitchen' ? 'kitchen' : from === '/admin' ? 'admin' : null
  );
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const { mutate: login, isPending, error } = useMutation({
    mutationFn: () => authApi.login(selectedRole!, password),
    onSuccess: (data) => {
      queryClient.setQueryData(['auth'], data);
      toast.success(`Welcome back!`);
      if (from) return navigate(from, { replace: true });
      navigate(data.role === 'admin' ? '/admin' : '/kitchen', { replace: true });
    },
    onError: () => {
      toast.error('Incorrect password. Please try again.');
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedRole) { toast.error('Please select a role'); return; }
    if (!password.trim()) { toast.error('Please enter your password'); return; }
    login();
  };

  return (
    <div className="min-h-screen flex flex-col" style={{ background: 'var(--bg)' }}>
      {/* Header */}
      <header style={{ background: 'var(--surface)', borderBottom: '1px solid var(--border)' }}>
        <div className="max-w-md mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-2xl">🍽️</span>
            <span className="font-black text-xl tracking-tight" style={{ color: 'var(--text)' }}>OrderFlow</span>
          </div>
          <DarkModeToggle />
        </div>
      </header>

      {/* Main */}
      <main className="flex-1 flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-md space-y-6">
          {/* Title */}
          <div className="text-center space-y-1">
            <h1 className="text-3xl font-black" style={{ color: 'var(--text)' }}>Staff Login</h1>
            <p className="text-sm" style={{ color: 'var(--text-2)' }}>Select your role and enter your password</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Role Selection */}
            <div className="space-y-2">
              <label className="text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--text-3)' }}>
                Your Role
              </label>
              <div className="grid grid-cols-2 gap-3">
                {ROLES.map(role => {
                  const isSelected = selectedRole === role.id;
                  return (
                    <button
                      key={role.id}
                      type="button"
                      onClick={() => setSelectedRole(role.id)}
                      className="p-4 rounded-2xl text-left transition-all duration-200"
                      style={{
                        background: isSelected ? 'var(--accent)' : 'var(--surface)',
                        border: `2px solid ${isSelected ? 'var(--accent)' : 'var(--border)'}`,
                        boxShadow: isSelected ? '0 4px 20px rgba(249,115,22,0.25)' : 'none',
                        transform: isSelected ? 'scale(1.02)' : 'scale(1)',
                      }}
                    >
                      <div className="text-3xl mb-2">{role.icon}</div>
                      <p className="font-bold text-sm" style={{ color: isSelected ? '#fff' : 'var(--text)' }}>
                        {role.label}
                      </p>
                      <p className="text-xs mt-0.5 leading-snug" style={{ color: isSelected ? 'rgba(255,255,255,0.75)' : 'var(--text-3)' }}>
                        {role.desc}
                      </p>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Password */}
            <div className="space-y-2">
              <label className="text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--text-3)' }}>
                Password
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  className="input w-full pr-12"
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(v => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-lg"
                  style={{ color: 'var(--text-3)' }}
                >
                  {showPassword ? '🙈' : '👁️'}
                </button>
              </div>
              {error && (
                <p className="text-xs font-medium text-red-500">Incorrect password. Please try again.</p>
              )}
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={isPending || !selectedRole}
              className="btn btn-primary w-full"
              style={{ padding: '14px', borderRadius: '14px', fontSize: '15px', opacity: !selectedRole ? 0.5 : 1 }}
            >
              {isPending ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Signing in…
                </span>
              ) : '🔐 Sign In'}
            </button>
          </form>

          {/* Back link */}
          <p className="text-center text-sm" style={{ color: 'var(--text-3)' }}>
            Not staff?{' '}
            <a href="/" className="font-semibold" style={{ color: 'var(--accent)' }}>
              Go to menu →
            </a>
          </p>
        </div>
      </main>
    </div>
  );
}
