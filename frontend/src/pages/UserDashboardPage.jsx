import { Link } from 'react-router-dom';
import { CalendarDays, Bell, Send, Heart, FolderKanban, BookOpen } from 'lucide-react';

const UserDashboardPage = () => {
  const items = [
    { to: '/meal-planner', label: 'Meal Planner', icon: CalendarDays, desc: 'Plan meals and generate shopping lists.' },
    { to: '/submissions', label: 'My Submissions', icon: Send, desc: 'Submit recipes for admin approval.' },
    { to: '/notifications', label: 'Notifications', icon: Bell, desc: 'Track approvals, comments, and updates.' },
    { to: '/favorites', label: 'Favorites', icon: Heart, desc: 'Quickly access saved recipes.' },
    { to: '/collections', label: 'Collections', icon: FolderKanban, desc: 'Organize recipes into themed collections.' },
    { to: '/recipes/mine', label: 'My Recipes', icon: BookOpen, desc: 'Manage recipes you have created.' },
  ];

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">User Dashboard</h1>
        <p className="text-gray-600 mt-2">Manage your cooking workflow in one place.</p>
      </div>
      <div className="grid md:grid-cols-2 gap-5">
        {items.map((item) => (
          <Link key={item.to} to={item.to} className="bg-white border border-gray-100 rounded-2xl p-6 hover:shadow-md transition-shadow">
            <div className="flex items-center gap-3 mb-2">
              <item.icon className="h-5 w-5 text-orange-600" />
              <h2 className="font-semibold text-gray-900">{item.label}</h2>
            </div>
            <p className="text-sm text-gray-600">{item.desc}</p>
          </Link>
        ))}
      </div>
    </div>
  );
};

export default UserDashboardPage;
