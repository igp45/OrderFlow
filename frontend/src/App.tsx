import { useEffect, useState } from 'react';
import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'react-hot-toast';
import MenuPage from './pages/MenuPage';
import OrderTrackerPage from './pages/OrderTrackerPage';
import KitchenPage from './pages/KitchenPage';
import AdminPage from './pages/AdminPage';
import LoginPage from './pages/LoginPage';
import ProtectedRoute from './components/ProtectedRoute';
import SplashScreen from './components/SplashScreen';
import { initTheme, useThemeStore } from './stores/themeStore';

const CUSTOMER_PATHS = ['/', '/order'];

function SplashGate({ children }: { children: React.ReactNode }) {
  const location = useLocation();
  const isCustomerRoute = CUSTOMER_PATHS.some(p => location.pathname === p || location.pathname.startsWith('/order/'));
  const [done, setDone] = useState(() => {
    return !isCustomerRoute || sessionStorage.getItem('of_splashed') === '1';
  });

  const handleDone = () => {
    sessionStorage.setItem('of_splashed', '1');
    setDone(true);
  };

  return (
    <>
      {!done && <SplashScreen onDone={handleDone} />}
      <div style={{ visibility: done ? 'visible' : 'hidden' }}>{children}</div>
    </>
  );
}

initTheme();

const queryClient = new QueryClient({
  defaultOptions: { queries: { staleTime: 1000 * 30, retry: 1 } },
});

export default function App() {
  const dark = useThemeStore(s => s.dark);

  useEffect(() => {
    document.documentElement.classList.toggle('dark', dark);
  }, [dark]);

  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <SplashGate>
        <Routes>
          <Route path="/" element={<MenuPage />} />
          <Route path="/order/:id" element={<OrderTrackerPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route
            path="/kitchen"
            element={
              <ProtectedRoute allowedRoles={['admin', 'kitchen']}>
                <KitchenPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin"
            element={
              <ProtectedRoute allowedRoles={['admin']}>
                <AdminPage />
              </ProtectedRoute>
            }
          />
        </Routes>
        </SplashGate>
      </BrowserRouter>
      <Toaster
        position="top-right"
        toastOptions={{
          duration: 3500,
          style: {
            background: dark ? '#18181C' : '#fff',
            color: dark ? '#F2F2F0' : '#1A1917',
            border: `1px solid ${dark ? '#2E2E38' : '#E8E6E0'}`,
            borderRadius: '12px',
            fontSize: '14px',
            fontWeight: '500',
            boxShadow: '0 8px 32px rgba(0,0,0,0.12)',
            padding: '12px 16px',
          },
          success: { iconTheme: { primary: '#22c55e', secondary: '#fff' } },
          error: { iconTheme: { primary: '#ef4444', secondary: '#fff' } },
        }}
      />
    </QueryClientProvider>
  );
}
