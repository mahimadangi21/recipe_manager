import { Link, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';
import { useAdminStore } from '../../store/adminStore';
import { useNotificationStore } from '../../store/notificationStore';
import { ChefHat, Menu, User, LogOut, PlusCircle, ShieldCheck, LayoutDashboard, Bell, Info } from 'lucide-react';
import { Badge } from '../UI/Badge';
import { useState, useEffect } from 'react';

const Navbar = () => {
  const { isAuthenticated: isUserAuth, user: userData, logout: userLogout } = useAuthStore();
  const { isAuthenticated: isAdminAuth, admin: adminData, logout: adminLogout } = useAdminStore();
  const { unreadCount, fetchNotifications } = useNotificationStore();
  const navigate = useNavigate();
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const isAuthenticated = isUserAuth || isAdminAuth;
  const user = isAdminAuth ? adminData : userData;
  const isAdmin = isAdminAuth;

  useEffect(() => {
    if (isAuthenticated) {
      fetchNotifications();
      // Poll for new notifications every minute
      const interval = setInterval(fetchNotifications, 60000);
      return () => clearInterval(interval);
    }
  }, [isAuthenticated, fetchNotifications]);

  const handleLogout = async () => {
    if (isAdminAuth) {
      await adminLogout();
      navigate('/admin/login');
    } else {
      await userLogout();
      navigate('/login');
    }
  };

  return (
    <nav className="bg-white shadow-sm border-b border-gray-100 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            <Link to="/recipes" className="flex items-center gap-2 group">
              <div className="bg-orange-500 p-2 rounded-xl group-hover:bg-orange-600 transition-colors">
                <ChefHat className="h-6 w-6 text-white" />
              </div>
              <span className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-orange-600 to-amber-500">
                RecipeManager
              </span>
            </Link>
          </div>

          {/* Desktop Menu */}
          <div className="hidden md:flex md:items-center md:space-x-4">
            {/* Common Public Link */}
            {!isAdmin && (
              <Link to="/recipes" className="text-gray-600 hover:text-orange-500 px-3 py-2 rounded-md font-medium transition-colors">
                Explore
              </Link>
            )}
            
            {/* Admin Specific Links */}
            {isAdmin ? (
              <>
                <Link to="/admin/dashboard" className="text-purple-600 hover:text-purple-700 px-3 py-2 rounded-md font-medium transition-colors flex items-center gap-1.5">
                  <LayoutDashboard className="h-4 w-4" /> Overview
                </Link>
                <Link to="/admin/recipes" className="text-gray-600 hover:text-purple-500 px-3 py-2 rounded-md font-medium transition-colors">
                  Recipes
                </Link>
                <Link to="/admin/users" className="text-gray-600 hover:text-purple-500 px-3 py-2 rounded-md font-medium transition-colors">
                  Users
                </Link>
                <Link to="/admin/submissions" className="text-gray-600 hover:text-purple-500 px-3 py-2 rounded-md font-medium transition-colors">
                  Submissions
                </Link>
              </>
            ) : isUserAuth ? (
              <>
                <Link to="/favorites" className="text-gray-600 hover:text-orange-500 px-3 py-2 rounded-md font-medium transition-colors">
                  Favorites
                </Link>
                <Link to="/collections" className="text-gray-600 hover:text-orange-500 px-3 py-2 rounded-md font-medium transition-colors">
                  Collections
                </Link>
                <Link to="/dashboard" className="text-gray-600 hover:text-orange-500 px-3 py-2 rounded-md font-medium transition-colors">
                  My Dashboard
                </Link>
              </>
            ) : null}

            {isAuthenticated ? (
              <>
                <Link to="/notifications" className="relative text-gray-600 hover:text-orange-500 px-3 py-2 rounded-md font-medium transition-colors">
                  <Bell className="h-5 w-5" />
                  {unreadCount > 0 && (
                    <span className="absolute top-1 right-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white shadow-sm ring-2 ring-white">
                      {unreadCount > 9 ? '9+' : unreadCount}
                    </span>
                  )}
                </Link>
                <div className="h-6 w-px bg-gray-200 mx-2"></div>
                <div className="relative ml-3">
                  <button 
                    onClick={() => setIsProfileMenuOpen((prev) => !prev)}
                    className="flex text-sm border-2 border-transparent rounded-full focus:outline-none focus:border-orange-500 transition duration-150 ease-in-out"
                  >
                    <img className="h-8 w-8 rounded-full object-cover bg-gray-100" src={user?.avatar_url || `https://ui-avatars.com/api/?name=${user?.username}&background=f97316&color=fff`} alt="" />
                  </button>
                  
                  {isProfileMenuOpen && (
                    <div className="absolute right-0 w-48 mt-2 origin-top-right bg-white border border-gray-100 rounded-xl shadow-lg transition-all duration-200 py-1 z-50">
                      <div className="px-4 py-2 border-b border-gray-50 mb-1">
                        <p className="text-sm font-bold text-gray-900 truncate">{user?.username}</p>
                        {isAdmin && (
                          <Badge variant="admin" className="mt-1 uppercase tracking-wider text-[10px] gap-1">
                            <ShieldCheck className="h-2.5 w-2.5" /> Admin
                          </Badge>
                        )}
                      </div>
                      <Link to="/profile" onClick={() => setIsProfileMenuOpen(false)} className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2">
                        <User className="h-4 w-4" /> Profile
                      </Link>
                      <button 
                        onClick={() => {
                          setIsProfileMenuOpen(false);
                          handleLogout();
                        }} 
                        className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 flex items-center gap-2"
                      >
                        <LogOut className="h-4 w-4" /> Sign out
                      </button>
                    </div>
                  )}
                </div>
              </>
            ) : (
              <div className="flex items-center space-x-3 ml-4">
                <Link to="/login" className="text-gray-600 hover:text-orange-500 font-medium px-3 py-2">
                  Log in
                </Link>
                <Link to="/register" className="bg-gradient-to-r from-orange-500 to-amber-500 text-white hover:from-orange-600 hover:to-amber-600 px-5 py-2 rounded-full font-medium shadow-sm hover:shadow transition-all">
                  Sign up
                </Link>
              </div>
            )}
          </div>

          {/* Mobile menu button */}
          <div className="flex items-center md:hidden">
            <button 
              onClick={() => setIsMobileMenuOpen((prev) => !prev)}
              className="inline-flex items-center justify-center p-2 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100 focus:outline-none"
            >
              <Menu className="h-6 w-6" />
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      {isMobileMenuOpen && (
        <div className="md:hidden border-t border-gray-100 bg-white">
          <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3">
            {!isAdmin && (
              <Link to="/recipes" className="block px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:text-orange-500 hover:bg-gray-50">
                Explore
              </Link>
            )}
            
            {isAdmin ? (
              <>
                <Link to="/admin/dashboard" className="block px-3 py-2 rounded-md text-base font-medium text-purple-600 hover:bg-purple-50">
                  Dashboard Overview
                </Link>
                <Link to="/admin/recipes" className="block px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:bg-gray-50">
                  Manage Recipes
                </Link>
                <Link to="/admin/users" className="block px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:bg-gray-50">
                  Manage Users
                </Link>
                <Link to="/admin/submissions" className="block px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:bg-gray-50">
                  Submissions
                </Link>
              </>
            ) : isUserAuth ? (
              <>
                <Link to="/favorites" className="block px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:text-orange-500 hover:bg-gray-50">
                  Favorites
                </Link>
                <Link to="/collections" className="block px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:text-orange-500 hover:bg-gray-50">
                  Collections
                </Link>
                <Link to="/dashboard" className="block px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:text-orange-500 hover:bg-gray-50">
                  My Dashboard
                </Link>
              </>
            ) : (
              <>
                <Link to="/login" className="block px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:text-orange-500 hover:bg-gray-50">
                  Log in
                </Link>
                <Link to="/register" className="block px-3 py-2 rounded-md text-base font-medium text-orange-600 hover:bg-orange-50">
                  Sign up
                </Link>
              </>
            )}
            
            {isAuthenticated && (
              <>
                <div className="border-t border-gray-100 my-2"></div>
                <Link to="/profile" className="block px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:text-orange-500 hover:bg-gray-50">
                  Profile
                </Link>
                <button onClick={handleLogout} className="w-full text-left block px-3 py-2 rounded-md text-base font-medium text-red-600 hover:bg-red-50">
                  Sign out
                </button>
              </>
            )}
          </div>
        </div>
      )}
    </nav>
  );
};

export default Navbar;
