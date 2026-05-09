import { useEffect, useState } from 'react';
import axiosInstance from '../api/axiosInstance';
import { toast } from 'react-hot-toast';

const AdminOpsPage = () => {
  const [analytics, setAnalytics] = useState(null);
  const [pending, setPending] = useState([]);
  const [comments, setComments] = useState([]);

  const load = async () => {
    const [a, p, c] = await Promise.all([
      axiosInstance.get('/admin/dashboard/analytics'),
      axiosInstance.get('/admin/submissions', { params: { status_filter: 'pending' } }),
      axiosInstance.get('/admin/comments'),
    ]);
    setAnalytics(a.data);
    setPending(p.data);
    setComments(c.data.slice(0, 10));
  };

  useEffect(() => {
    load().catch(() => toast.error('Failed to load admin ops data'));
  }, []);

  const review = async (id, approved) => {
    try {
      await axiosInstance.post(`/admin/submissions/${id}/review`, { approved, admin_notes: approved ? 'Approved' : 'Needs improvement' });
      await load();
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Review failed');
    }
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <h1 className="text-3xl font-bold text-gray-900">Admin Operations</h1>
      {analytics && (
        <div className="grid md:grid-cols-3 lg:grid-cols-6 gap-3">
          {Object.entries(analytics).map(([k, v]) => (
            <div key={k} className="bg-white border border-gray-100 rounded-xl p-4">
              <p className="text-xs uppercase text-gray-500">{k.replace('_', ' ')}</p>
              <p className="text-xl font-bold text-gray-900">{v}</p>
            </div>
          ))}
        </div>
      )}
      <div className="grid lg:grid-cols-2 gap-6">
        <div className="bg-white border border-gray-100 rounded-2xl p-5">
          <h2 className="text-xl font-semibold text-gray-900 mb-3">Pending Recipe Approvals</h2>
          <div className="space-y-3">
            {pending.length === 0 ? (
              <p className="text-sm text-gray-500">No pending submissions.</p>
            ) : pending.map((s) => (
              <div key={s.id} className="border border-gray-100 rounded-lg p-3">
                <p className="font-medium text-gray-900">{s.title}</p>
                <div className="flex gap-2 mt-2">
                  <button onClick={() => review(s.id, true)} className="px-3 py-1 text-sm bg-green-600 text-white rounded">Approve</button>
                  <button onClick={() => review(s.id, false)} className="px-3 py-1 text-sm bg-red-600 text-white rounded">Reject</button>
                </div>
              </div>
            ))}
          </div>
        </div>
        <div className="bg-white border border-gray-100 rounded-2xl p-5">
          <h2 className="text-xl font-semibold text-gray-900 mb-3">Recent Comments</h2>
          <div className="space-y-2">
            {comments.length === 0 ? (
              <p className="text-sm text-gray-500">No comments yet.</p>
            ) : comments.map((c) => (
              <div key={c.id} className="border border-gray-100 rounded-lg p-3 text-sm text-gray-700">
                #{c.id} on recipe {c.recipe_id}: {c.content}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminOpsPage;
