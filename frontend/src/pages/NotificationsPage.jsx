import { useEffect } from 'react';
import { useNotificationStore } from '../store/notificationStore';
import { 
  Bell, 
  CheckCircle2, 
  Trash2, 
  Loader2, 
  Clock, 
  Info, 
  CheckCircle, 
  AlertCircle, 
  XCircle,
  X
} from 'lucide-react';

const NotificationsPage = () => {
  const { 
    notifications, 
    unreadCount, 
    isLoading, 
    fetchNotifications, 
    markAsRead, 
    deleteNotification,
    clearAll 
  } = useNotificationStore();

  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  const getTypeStyles = (type) => {
    switch (type) {
      case 'submission':
      case 'submission_review':
        return { bg: 'bg-blue-50', icon: <CheckCircle className="h-5 w-5 text-blue-500" /> };
      case 'registration':
        return { bg: 'bg-purple-50', icon: <Info className="h-5 w-5 text-purple-500" /> };
      case 'new_recipe':
        return { bg: 'bg-orange-50', icon: <AlertCircle className="h-5 w-5 text-orange-500" /> };
      case 'favorite_update':
        return { bg: 'bg-amber-50', icon: <CheckCircle2 className="h-5 w-5 text-amber-500" /> };
      default:
        return { bg: 'bg-gray-50', icon: <Bell className="h-5 w-5 text-gray-500" /> };
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-20">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
            <div className="bg-orange-500 p-2 rounded-xl">
              <Bell className="h-6 w-6 text-white" />
            </div>
            Notifications
          </h1>
          <p className="text-gray-600 mt-2">
            You have {unreadCount} unread messages
          </p>
        </div>
        {notifications.length > 0 && (
          <button 
            onClick={clearAll}
            className="text-sm font-bold text-red-600 hover:text-red-700 px-4 py-2 border border-red-100 rounded-xl hover:bg-red-50 transition-all flex items-center gap-2"
          >
            <Trash2 className="h-4 w-4" />
            Clear All
          </button>
        )}
      </div>

      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-20 bg-white rounded-[2rem] border border-gray-100 border-dashed">
          <Loader2 className="h-10 w-10 text-orange-500 animate-spin" />
          <p className="mt-4 text-gray-500 font-medium">Syncing your alerts...</p>
        </div>
      ) : notifications.length > 0 ? (
        <div className="space-y-4">
          {notifications.map((n) => {
            const styles = getTypeStyles(n.type);
            return (
              <div 
                key={n.id} 
                className={`group relative bg-white border ${n.is_read ? 'border-gray-100' : 'border-orange-200 shadow-sm'} rounded-[1.5rem] p-6 transition-all hover:shadow-md`}
              >
                {!n.is_read && (
                  <div className="absolute top-6 right-12 h-2 w-2 rounded-full bg-orange-500 shadow-sm shadow-orange-200" />
                )}
                
                <div className="flex items-start gap-5">
                  <div className={`p-3 rounded-2xl ${styles.bg}`}>
                    {styles.icon}
                  </div>
                  <div className="flex-grow min-w-0">
                    <div className="flex items-center justify-between">
                      <h3 className={`font-bold ${n.is_read ? 'text-gray-900' : 'text-orange-900'}`}>{n.title}</h3>
                      <span className="text-xs text-gray-400 flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {new Date(n.created_at).toLocaleDateString()}
                      </span>
                    </div>
                    <p className="mt-1 text-gray-600 text-sm leading-relaxed">{n.message}</p>
                    
                    <div className="mt-4 flex items-center gap-3">
                      {!n.is_read && (
                        <button 
                          onClick={() => markAsRead(n.id)}
                          className="text-xs font-bold text-orange-600 bg-orange-50 px-3 py-1.5 rounded-lg hover:bg-orange-100 transition-colors"
                        >
                          Mark as read
                        </button>
                      )}
                    </div>
                  </div>
                </div>

                <button 
                  onClick={() => deleteNotification(n.id)}
                  className="absolute top-4 right-4 p-2 text-gray-300 hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="text-center py-20 bg-white rounded-[2.5rem] border border-gray-100 border-dashed">
          <div className="text-6xl mb-6 grayscale opacity-50">🔔</div>
          <h3 className="text-xl font-bold text-gray-900">Quiet for now</h3>
          <p className="text-gray-500 mt-2 max-w-sm mx-auto leading-relaxed">
            When you receive updates about your recipes or platform activity, they'll show up here.
          </p>
        </div>
      )}
    </div>
  );
};

export default NotificationsPage;
