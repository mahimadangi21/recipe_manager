import { useEffect } from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAdminStore } from '../../store/adminStore';
import { Shield } from 'lucide-react';

const NewAdminProtectedRoute = () => {
  const { isAuthenticated, admin, isLoading, loadAdmin } = useAdminStore();
  const location = useLocation();

  useEffect(() => {
    // Verify session with backend on mount
    loadAdmin();
  }, []);

  if (isLoading && !admin) {
    return (
      <div className="min-h-screen flex flex-col justify-center items-center bg-gray-50 gap-4">
        <div className="relative">
          <div className="h-16 w-16 rounded-full border-4 border-indigo-100 border-t-indigo-600 animate-spin" />
          <Shield className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-6 w-6 text-indigo-600" />
        </div>
        <p className="text-gray-400 font-bold uppercase tracking-widest text-[10px]">Verifying Security Credentials...</p>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/admin/login" state={{ from: location }} replace />;
  }

  return <Outlet />;
};

export default NewAdminProtectedRoute;
