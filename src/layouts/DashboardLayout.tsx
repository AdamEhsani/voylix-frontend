import { Outlet, Navigate } from 'react-router-dom';
import { Sidebar } from '../components/Sidebar';
import { useAuth } from '../contexts/AuthContext';

export function DashboardLayout() {
  const { isAuthenticated } = useAuth();

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100">
      <Sidebar />
      <main className="lg:pl-64 transition-all duration-300 print:pl-0">
        <div className="max-w-7xl mx-auto p-4 md:p-8 print:p-0 print:max-w-none">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
