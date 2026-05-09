import { useEffect } from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAdminStore } from '../../store/adminStore';

const AdminProtectedRoute = () => {
  const { isAuthenticated, admin, isLoading, loadAdmin } = useAdminStore();
  const location = useLocation();
  const storedRole = localStorage.getItem('role');

  console.log('Admin Route Access Attempt:', { isAuthenticated, admin: !!admin, role: storedRole });

  useEffect(() => {
    loadAdmin();
  }, []);

  if (isLoading && !admin) {
    return (
      <div className="min-h-screen flex flex-col justify-center items-center bg-gray-50 gap-4">
        <div className="h-16 w-16 rounded-full border-4 border-indigo-100 border-t-indigo-600 animate-spin" />
        <p className="text-gray-400 font-bold uppercase tracking-widest text-[10px]">Verifying Security Credentials...</p>
      </div>
    );
  }

  if (!isAuthenticated || storedRole !== 'admin') {
    console.log('Unauthorized admin access. Redirecting to /admin/login');
    return <Navigate to="/admin/login" state={{ from: location }} replace />;
  }

  return <Outlet />;
};

export default AdminProtectedRoute;
