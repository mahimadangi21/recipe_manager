import { useEffect, useState } from 'react';
import axiosInstance from '../api/axiosInstance';
import { toast } from 'react-hot-toast';
import Skeleton from '../components/UI/Skeleton';

const SubmissionsPage = () => {
  const [submissions, setSubmissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [title, setTitle] = useState('');
  const [payload, setPayload] = useState(`{
  "title": "",
  "description": "",
  "instructions": "",
  "servings": 2,
  "category": "dinner",
  "difficulty": "easy",
  "is_public": true,
  "ingredients": [{"name":"salt","quantity":1,"unit":"tsp"}]
}`);

  const load = async () => {
    try {
      setLoading(true);
      const result = await axiosInstance.get('/submissions');
      setSubmissions(result.data || []);
    } catch (err) {
      toast.error('Failed to load submissions');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const submit = async (e) => {
    e.preventDefault();
    try {
      setSubmitting(true);
      await axiosInstance.post('/submissions', { title, payload: JSON.parse(payload) });
      setTitle('');
      await load();
      toast.success('Recipe submitted for approval');
    } catch (err) {
      toast.error(err.response?.data?.message || err.response?.data?.detail || 'Invalid payload');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto grid lg:grid-cols-2 gap-8 px-4 py-8">
      <div className="bg-white border border-gray-100 rounded-3xl shadow-sm p-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-6">Submit a Recipe</h1>
        <p className="text-gray-500 mb-6">Share your culinary creations with our community. All submissions are reviewed by our team before being published.</p>
        <form onSubmit={submit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Recipe Title</label>
            <input 
              className="w-full border border-gray-200 rounded-xl px-4 py-3 focus:ring-2 focus:ring-orange-500 outline-none transition-all" 
              placeholder="e.g. Grandma's Secret Pasta" 
              value={title} 
              onChange={(e) => setTitle(e.target.value)} 
              required 
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Recipe Data (JSON)</label>
            <textarea 
              className="w-full h-80 border border-gray-200 rounded-xl px-4 py-3 font-mono text-xs focus:ring-2 focus:ring-orange-500 outline-none transition-all" 
              value={payload} 
              onChange={(e) => setPayload(e.target.value)} 
            />
          </div>
          <button 
            disabled={submitting}
            className="w-full bg-orange-500 hover:bg-orange-600 text-white rounded-xl px-6 py-4 font-semibold shadow-lg shadow-orange-100 transition-all disabled:opacity-50"
          >
            {submitting ? 'Submitting...' : 'Submit for Review'}
          </button>
        </form>
      </div>

      <div className="bg-gray-50 rounded-3xl p-8">
        <h2 className="text-2xl font-bold text-gray-900 mb-6">Submission History</h2>
        <div className="space-y-4">
          {loading ? (
            <Skeleton count={3} className="h-24 w-full" />
          ) : submissions.length === 0 ? (
            <div className="text-center py-12 bg-white rounded-2xl border border-dashed border-gray-200">
              <p className="text-gray-500">No submissions found.</p>
            </div>
          ) : submissions.map((s) => (
            <div key={s.id} className="bg-white border border-gray-100 rounded-2xl p-5 shadow-sm">
              <div className="flex justify-between items-start mb-2">
                <p className="font-bold text-gray-900">{s.title}</p>
                <span className={`text-xs px-2 py-1 rounded-full font-bold uppercase tracking-wider ${
                  s.status === 'approved' ? 'bg-green-100 text-green-700' : 
                  s.status === 'rejected' ? 'bg-red-100 text-red-700' : 'bg-blue-100 text-blue-700'
                }`}>
                  {s.status}
                </span>
              </div>
              <p className="text-xs text-gray-400 mb-3">Submitted on {new Date(s.created_at).toLocaleDateString()}</p>
              {s.admin_notes && (
                <div className="bg-gray-50 rounded-lg p-3 text-sm text-gray-600 border-l-4 border-orange-200">
                  <span className="font-semibold block mb-1">Feedback:</span>
                  {s.admin_notes}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default SubmissionsPage;
