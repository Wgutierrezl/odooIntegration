import { Outlet, Navigate } from 'react-router-dom';
import { useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import Sidebar from './Sidebar';
import { branding, t } from '../../config/branding';

export default function AppLayout() {
  const { user, loading } = useAuth();

  useEffect(() => {
    document.title = `${branding.platformName} | ${branding.companyName}`;
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-gray-500">{t.loading}</p>
      </div>
    );
  }

  if (!user) return <Navigate to="/login" />;

  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar />
      <main className="flex-1 p-6 overflow-auto">
        <Outlet />
      </main>
    </div>
  );
}
