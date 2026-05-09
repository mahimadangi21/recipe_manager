import { useForm } from 'react-hook-form';
import { useAuthStore } from '../store/authStore';
import { toast } from 'react-hot-toast';
import { User, Mail, Camera, Loader2 } from 'lucide-react';

const ProfilePage = () => {
  const { user, updateProfile, isLoading } = useAuthStore();
  
  const { register, handleSubmit, formState: { errors } } = useForm({
    defaultValues: {
      username: user?.username || '',
      bio: user?.bio || '',
      avatar_url: user?.avatar_url || ''
    }
  });

  const onSubmit = async (data) => {
    try {
      await updateProfile(data);
      toast.success('Profile updated successfully');
    } catch (error) {
      toast.error('Failed to update profile');
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-8">
      <div className="bg-white p-8 rounded-3xl shadow-sm border border-gray-100">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">My Profile</h1>
        
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <div className="flex items-center gap-6 pb-6 border-b border-gray-100">
            <div className="relative h-24 w-24">
              <img 
                src={user?.avatar_url || `https://ui-avatars.com/api/?name=${user?.username}&background=f97316&color=fff&size=96`} 
                alt={user?.username} 
                className="h-24 w-24 rounded-full object-cover border-4 border-white shadow-md bg-gray-100"
              />
            </div>
            <div className="flex-grow">
              <label className="block text-sm font-medium text-gray-700 mb-1">Avatar URL</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Camera className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  {...register('avatar_url')}
                  className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-xl shadow-sm focus:ring-orange-500 focus:border-orange-500 sm:text-sm"
                  placeholder="https://example.com/avatar.jpg"
                />
              </div>
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Username</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <User className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  {...register('username', { required: 'Username is required' })}
                  className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-xl shadow-sm focus:ring-orange-500 focus:border-orange-500 sm:text-sm"
                />
              </div>
              {errors.username && <p className="mt-1 text-sm text-red-600">{errors.username.message}</p>}
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Mail className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  disabled
                  value={user?.email || ''}
                  className="block w-full pl-10 pr-3 py-2 border border-gray-200 bg-gray-50 text-gray-500 rounded-xl shadow-sm sm:text-sm"
                />
              </div>
              <p className="mt-1 text-xs text-gray-500">Email cannot be changed</p>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Bio</label>
            <textarea
              {...register('bio')}
              rows={4}
              className="block w-full px-3 py-2 border border-gray-300 rounded-xl shadow-sm focus:ring-orange-500 focus:border-orange-500 sm:text-sm"
              placeholder="Tell us a little about yourself..."
            />
          </div>

          <div className="pt-4 flex justify-end">
            <button
              type="submit"
              disabled={isLoading}
              className="flex justify-center items-center px-6 py-2 border border-transparent rounded-xl shadow-sm text-sm font-medium text-white bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500 transition-all"
            >
              {isLoading ? <Loader2 className="animate-spin h-5 w-5 mr-2" /> : null}
              Save Changes
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ProfilePage;
