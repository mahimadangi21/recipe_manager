import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';
import { useAdminStore } from '../../store/adminStore';

const ProtectedRoute = () => {
  const { isAuthenticated: isUserAuth, isLoading: isUserLoading } = useAuthStore();
  const { isAuthenticated: isAdminAuth, isLoading: isAdminLoading } = useAdminStore();
  const location = useLocation();
  const storedRole = localStorage.getItem('role');

  const isAuthenticated = isUserAuth || isAdminAuth;
  const isLoading = isUserLoading && isAdminLoading;

  console.log('Route Access Attempt:', { isUserAuth, isAdminAuth, role: storedRole });

  if (isLoading && !isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-orange-500"></div>
      </div>
    );
  }

  if (!isAuthenticated) {
    console.log('Unauthorized access. Redirecting to /login');
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return <Outlet />;
};

export default ProtectedRoute;
