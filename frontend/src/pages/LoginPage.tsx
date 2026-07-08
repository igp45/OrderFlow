import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { authApi } from '../lib/api';
import DarkModeToggle from '../components/DarkModeToggle';

const ROLES = [
  { id: 'kitchen', label: 'Kitchen Staff', icon: '👨‍🍳', desc: 'Live order queue & status updates' },
  { id: 'admin',   label: 'Admin',         icon: '📊',   desc: 'Dashboard, menu & analytics' },
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
      toast.success('Welcome back!');
      if (from) return navigate(from, { replace: true });
      navigate(data.role === 'admin' ? '/admin' : '/kitchen', { replace: true });
    },
    onError: () => toast.error('Incorrect password. Please try again.'),
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedRole) { toast.error('Please select a role'); return; }
    if (!password.trim()) { toast.error('Please enter your password'); return; }
    login();
  };

  return (
    <div className="min-h-screen flex" style={{ background: 'var(--bg)' }}>

      {/* ── Left brand panel (desktop only) ── */}
      <div className="hidden lg:flex lg:w-[45%] xl:w-[42%] flex-col relative overflow-hidden flex-shrink-0"
        style={{ background: 'linear-gradient(145deg, #0E0E10 0%, #1c0f04 40%, #7c2d00 100%)' }}>

        {/* Subtle dot grid */}
        <div className="absolute inset-0 opacity-[0.06]" style={{
          backgroundImage: 'radial-gradient(circle, #fff 1px, transparent 1px)',
          backgroundSize: '28px 28px',
        }} />

        {/* Glow blob */}
        <div className="absolute" style={{
          width: 400, height: 400, borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(249,115,22,0.22) 0%, transparent 70%)',
          top: '30%', left: '10%', transform: 'translate(-20%, -30%)',
        }} />

        {/* Content */}
        <div className="relative z-10 flex flex-col h-full px-10 py-10">
          {/* Logo */}
          <div className="flex items-center gap-3">
            <img src="/logo.png" alt="OrderFlow" className="w-10 h-10 rounded-xl object-contain" />
            <span className="text-white font-black text-xl tracking-tight">OrderFlow</span>
          </div>

          {/* Centre text */}
          <div className="flex-1 flex flex-col justify-center">
            <p className="text-xs font-bold uppercase tracking-widest mb-4" style={{ color: 'rgba(249,115,22,0.8)' }}>
              Staff Portal
            </p>
            <h1 className="text-4xl xl:text-5xl font-black text-white leading-tight mb-4">
              Run your<br />restaurant<br />seamlessly.
            </h1>
            <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: 15, lineHeight: 1.7, maxWidth: 300 }}>
              Manage live orders, track revenue, update your menu, and delight every customer — all from one place.
            </p>
          </div>

          {/* Meal photo */}
          <div className="relative mb-8">
            <div style={{
              borderRadius: 24, overflow: 'hidden', height: 200,
              boxShadow: '0 20px 60px rgba(0,0,0,0.5)',
              border: '1px solid rgba(255,255,255,0.08)',
            }}>
              <img
                src="https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=600"
                alt="Classic Cheeseburger"
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0" style={{ background: 'linear-gradient(to top, rgba(0,0,0,0.5) 0%, transparent 60%)' }} />
            </div>
            <div className="absolute bottom-4 left-4 flex items-center gap-2">
              <span className="text-white font-bold text-sm">Classic Cheeseburger</span>
              <span className="text-xs px-2 py-0.5 rounded-full font-bold"
                style={{ background: 'rgba(249,115,22,0.9)', color: '#fff' }}>
                🔥 #1 Today
              </span>
            </div>
          </div>

          {/* Footer */}
          <p style={{ color: 'rgba(255,255,255,0.2)', fontSize: 12 }}>
            © {new Date().getFullYear()} OrderFlow · All rights reserved
          </p>
        </div>
      </div>

      {/* ── Right form panel ── */}
      <div className="flex-1 flex flex-col">
        {/* Top bar */}
        <div className="flex items-center justify-between px-6 py-4"
          style={{ borderBottom: '1px solid var(--border)' }}>
          {/* Mobile logo */}
          <div className="flex items-center gap-2 lg:opacity-0 lg:pointer-events-none">
            <img src="/logo.png" alt="OrderFlow" className="w-8 h-8 rounded-lg object-contain" />
            <span className="font-black text-lg" style={{ color: 'var(--text)' }}>OrderFlow</span>
          </div>
          <DarkModeToggle />
        </div>

        {/* Form */}
        <div className="flex-1 flex items-center justify-center px-6 py-10">
          <div className="w-full max-w-sm space-y-7">

            {/* Heading */}
            <div>
              <h2 className="text-3xl font-black" style={{ color: 'var(--text)' }}>Staff Login</h2>
              <p className="text-sm mt-1" style={{ color: 'var(--text-2)' }}>
                Sign in to access your workspace
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
              {/* Role selection */}
              <div className="space-y-2">
                <label className="text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--text-3)' }}>
                  Select role
                </label>
                <div className="grid grid-cols-2 gap-3">
                  {ROLES.map(role => {
                    const active = selectedRole === role.id;
                    return (
                      <button
                        key={role.id}
                        type="button"
                        onClick={() => setSelectedRole(role.id)}
                        className="p-4 rounded-2xl text-left transition-all duration-200"
                        style={{
                          background: active ? 'var(--accent)' : 'var(--surface)',
                          border: `1.5px solid ${active ? 'var(--accent)' : 'var(--border)'}`,
                          boxShadow: active ? '0 4px 20px rgba(249,115,22,0.25)' : 'var(--shadow-sm)',
                          transform: active ? 'translateY(-1px)' : 'none',
                        }}
                      >
                        <div className="text-2xl mb-2">{role.icon}</div>
                        <p className="font-bold text-sm" style={{ color: active ? '#fff' : 'var(--text)' }}>
                          {role.label}
                        </p>
                        <p className="text-xs mt-0.5 leading-snug" style={{ color: active ? 'rgba(255,255,255,0.7)' : 'var(--text-3)' }}>
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
                    className="input w-full pr-11"
                    autoComplete="current-password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(v => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-base transition-opacity hover:opacity-70"
                    style={{ color: 'var(--text-3)' }}
                    tabIndex={-1}
                  >
                    {showPassword ? '🙈' : '👁️'}
                  </button>
                </div>
                {error && (
                  <p className="text-xs font-medium text-red-500 flex items-center gap-1">
                    ⚠ Incorrect password. Please try again.
                  </p>
                )}
              </div>

              {/* Submit */}
              <button
                type="submit"
                disabled={isPending || !selectedRole}
                className="btn btn-primary w-full"
                style={{
                  padding: '13px',
                  borderRadius: '12px',
                  fontSize: '15px',
                  opacity: !selectedRole ? 0.45 : 1,
                  letterSpacing: '0.01em',
                }}
              >
                {isPending ? (
                  <span className="flex items-center justify-center gap-2">
                    <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Signing in…
                  </span>
                ) : 'Sign In →'}
              </button>
            </form>

            {/* Divider + back link */}
            <div className="flex items-center gap-3">
              <div className="flex-1 h-px" style={{ background: 'var(--border)' }} />
              <span className="text-xs" style={{ color: 'var(--text-3)' }}>or</span>
              <div className="flex-1 h-px" style={{ background: 'var(--border)' }} />
            </div>

            <a href="/" className="flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-semibold transition-all hover:scale-[1.01]"
              style={{ background: 'var(--surface-2)', color: 'var(--text-2)', border: '1px solid var(--border)' }}>
              🍽️ Go to Customer Menu
            </a>
          </div>
        </div>
      </div>

    </div>
  );
}
