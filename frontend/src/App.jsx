import { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { useAuthStore } from './store/authStore';
import { useAdminStore } from './store/adminStore';

// Layout
import Navbar from './components/Layout/Navbar';
import ProtectedRoute from './components/Layout/ProtectedRoute';
import AdminProtectedRoute from './components/Layout/AdminProtectedRoute';

// Pages
import HomePage from './pages/HomePage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import ProfilePage from './pages/ProfilePage';
import RecipeDetailPage from './pages/RecipeDetailPage';
import CreateRecipePage from './pages/CreateRecipePage';
import FavoritesPage from './pages/FavoritesPage';
import CollectionsPage from './pages/CollectionsPage';
import CollectionDetailPage from './pages/CollectionDetailPage';
import EditRecipePage from './pages/EditRecipePage';
import AdminPage from './pages/AdminPage';
import UserDashboardPage from './pages/UserDashboardPage';
import MealPlannerPage from './pages/MealPlannerPage';
import SubmissionsPage from './pages/SubmissionsPage';
import NotificationsPage from './pages/NotificationsPage';
import AdminOpsPage from './pages/AdminOpsPage';
import AdminLoginPage from './pages/AdminLoginPage';
import AdminDashboardPage from './pages/AdminDashboardPage';
import MyRecipesPage from './pages/MyRecipesPage';
import OTPVerifyPage from './pages/OTPVerifyPage';
import ForgotPasswordPage from './pages/ForgotPasswordPage';
import ResetPasswordPage from './pages/ResetPasswordPage';

function App() {
  const { loadUser, isLoading: isUserLoading } = useAuthStore();
  const { loadAdmin, isLoading: isAdminLoading } = useAdminStore();

  useEffect(() => {
    loadUser();
    loadAdmin();
  }, []);

  const isInitialLoad = isUserLoading && isAdminLoading;

  if (isInitialLoad) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-orange-500"></div>
      </div>
    );
  }

  return (
    <Router>
      <div className="min-h-screen flex flex-col bg-gradient-to-b from-slate-50 via-orange-50/30 to-white font-sans">
        <Navbar />
        <main className="flex-grow container mx-auto px-4 py-8 max-w-7xl">
          <Routes>
            <Route path="/" element={<Navigate to="/recipes" replace />} />
            <Route path="/recipes" element={<HomePage />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />
            <Route path="/forgot-password" element={<ForgotPasswordPage />} />
            <Route path="/forgot_password" element={<ForgotPasswordPage />} />
            <Route path="/verify-otp" element={<OTPVerifyPage />} />
            <Route path="/reset-password" element={<ResetPasswordPage />} />
            <Route path="/r/:token" element={<RecipeDetailPage isPublicView={true} />} />
            
            {/* Admin Authentication System (Isolated) */}
            <Route path="/admin/login" element={<AdminLoginPage />} />
            <Route element={<AdminProtectedRoute />}>
              <Route path="/admin/dashboard" element={<AdminDashboardPage activeTab="overview" />} />
              <Route path="/admin/recipes" element={<AdminDashboardPage activeTab="recipes" />} />
              <Route path="/admin/users" element={<AdminDashboardPage activeTab="users" />} />
              <Route path="/admin/submissions" element={<AdminDashboardPage activeTab="submissions" />} />
              <Route path="/admin" element={<Navigate to="/admin/dashboard" replace />} />
              <Route path="/admin/ops" element={<AdminOpsPage />} />
            </Route>

            {/* User Protected Routes */}
            <Route element={<ProtectedRoute />}>
              <Route path="/dashboard" element={<UserDashboardPage />} />
              <Route path="/recipes/mine" element={<MyRecipesPage />} />
              <Route path="/recipes/:id" element={<RecipeDetailPage />} />
              <Route path="/profile" element={<ProfilePage />} />
              <Route path="/favorites" element={<FavoritesPage />} />
              <Route path="/collections" element={<CollectionsPage />} />
              <Route path="/collections/:id" element={<CollectionDetailPage />} />
              <Route path="/meal-planner" element={<MealPlannerPage />} />
              <Route path="/submissions" element={<SubmissionsPage />} />
              <Route path="/notifications" element={<NotificationsPage />} />
              <Route path="/recipes/new" element={<CreateRecipePage />} />
              <Route path="/recipes/:id/edit" element={<EditRecipePage />} />
            </Route>
          </Routes>
        </main>
        <Toaster position="bottom-right" toastOptions={{
          style: {
            background: '#333',
            color: '#fff',
          },
          success: {
            iconTheme: {
              primary: '#f97316',
              secondary: '#fff',
            },
          },
        }} />
      </div>
    </Router>
  );
}

export default App;
