import React, { useState, useEffect } from 'react';
import { Clock, Edit2, Trash2, X, Image as ImageIcon, Calendar } from 'lucide-react';
import { FaXTwitter, FaLinkedin, FaFacebook, FaInstagram, FaGoogle, FaTelegram } from 'react-icons/fa6';
import { Magnetic } from '../components/ui/Magnetic';

interface ScheduledPost {
  _id: string;
  post: {
    _id: string;
    content: string;
    mediaUrls: string[];
  };
  platform: string;
  status: string;
  errorMessage?: string;
  scheduledFor: string;
  createdAt: string;
}

const platformIcons: Record<string, { icon: any, color: string, name: string }> = {
  telegram: { icon: FaTelegram, color: 'text-[#229ED9]', name: 'Telegram' },
  instagram: { icon: FaInstagram, color: 'text-[#E4405F]', name: 'Instagram' },
  facebook: { icon: FaFacebook, color: 'text-[#1877F2]', name: 'Facebook' },
  gmb: { icon: FaGoogle, color: 'text-[#4285F4]', name: 'Google Business' },
  linkedin: { icon: FaLinkedin, color: 'text-[#0A66C2]', name: 'LinkedIn' },
  twitter: { icon: FaXTwitter, color: 'text-white', name: 'X (Twitter)' },
  x: { icon: FaXTwitter, color: 'text-white', name: 'X' },
};

export default function Queues() {
  const [activeTab, setActiveTab] = useState<'scheduled' | 'drafts' | 'published'>('scheduled');
  const [jobs, setJobs] = useState<ScheduledPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Edit Modal State
  const [editingJob, setEditingJob] = useState<ScheduledPost | null>(null);
  const [viewingJob, setViewingJob] = useState<ScheduledPost | null>(null);
  const [editContent, setEditContent] = useState('');
  const [editDate, setEditDate] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [selectedJobs, setSelectedJobs] = useState<string[]>([]);

  useEffect(() => {
    setSelectedJobs([]);
    fetchQueue();
  }, [activeTab]);

  const fetchQueue = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        setError('Not authorized, no token');
        setLoading(false);
        return;
      }
      
      let endpoint = '/api/posts/queue';
      if (activeTab === 'drafts') endpoint = '/api/posts/drafts';
      if (activeTab === 'published') endpoint = '/api/posts/published';

      const res = await fetch(`https://schedulebubble-zjof.onrender.com${endpoint}`, {
        headers: { 'Authorization': `Bearer ${token}` },
        credentials: 'include'
      });
      if (res.ok) {
        const data = await res.json();
        setJobs(data);
      } else {
        setError('Failed to fetch data');
      }
    } catch (err) {
      setError('Error connecting to server');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Are you sure you want to cancel this scheduled post?')) return;
    
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`https://schedulebubble-zjof.onrender.com/api/posts/queue/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` },
        credentials: 'include'
      });
      if (res.ok) {
        setJobs(prev => prev.filter(j => j._id !== id));
        setSelectedJobs(prev => prev.filter(jobId => jobId !== id));
      } else {
        alert('Failed to delete post');
      }
    } catch (err) {
      alert('Error deleting post');
    }
  };

  const handleBulkDelete = async () => {
    if (selectedJobs.length === 0) return;
    if (!window.confirm(`Are you sure you want to delete ${selectedJobs.length} selected posts?`)) return;
    
    try {
      const token = localStorage.getItem('token');
      
      // Delete in parallel
      await Promise.all(selectedJobs.map(id => 
        fetch(`https://schedulebubble-zjof.onrender.com/api/posts/queue/${id}`, {
          method: 'DELETE',
          headers: { 'Authorization': `Bearer ${token}` },
          credentials: 'include'
        })
      ));
      
      setJobs(prev => prev.filter(j => !selectedJobs.includes(j._id)));
      setSelectedJobs([]);
    } catch (err) {
      alert('Error deleting some posts');
    }
  };

  const handleEditClick = (job: ScheduledPost) => {
    setEditingJob(job);
    setEditContent(job.post.content);
    // Format for datetime-local input
    if (job.scheduledFor) {
      const date = new Date(job.scheduledFor);
      // Adjust for timezone offset for input
      const tzoffset = (new Date()).getTimezoneOffset() * 60000;
      const localISOTime = (new Date(date.getTime() - tzoffset)).toISOString().slice(0,16);
      setEditDate(localISOTime);
    }
  };

  const handleSaveEdit = async (actionType?: 'save_draft' | 'schedule') => {
    if (!editingJob) return;
    setIsSaving(true);
    try {
      const token = localStorage.getItem('token');
      
      let newStatus = editingJob.status;
      let newDate = editDate ? new Date(editDate).toISOString() : undefined;

      if (actionType === 'save_draft') {
        newStatus = 'draft';
        newDate = undefined;
      } else if (actionType === 'schedule') {
        newStatus = 'scheduled';
      } else {
        newStatus = editDate ? 'scheduled' : newStatus;
      }
      
      const res = await fetch(`https://schedulebubble-zjof.onrender.com/api/posts/queue/${editingJob._id}`, {
        method: 'PUT',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}` 
        },
        body: JSON.stringify({
          content: editContent,
          scheduledFor: newDate,
          status: newStatus
        }),
        credentials: 'include'
      });

      if (res.ok) {
        if (activeTab === 'drafts' && actionType === 'schedule') {
          setJobs(jobs.filter(j => j._id !== editingJob._id));
        } else if (activeTab === 'scheduled' && actionType === 'save_draft') {
          setJobs(jobs.filter(j => j._id !== editingJob._id));
        } else {
          setJobs(jobs.map(j => {
            if (j._id === editingJob._id) {
              return {
                ...j,
                scheduledFor: newDate || j.scheduledFor,
                status: newStatus,
                post: { ...j.post, content: editContent }
              };
            }
            return j;
          }));
        }
        setEditingJob(null);
      } else {
        alert('Failed to update post');
      }
    } catch (err) {
      alert('Error updating post');
    } finally {
      setIsSaving(false);
    }
  };

  if (loading) return <div className="text-white text-center py-20 animate-pulse">Loading Queue...</div>;

  return (
    <div className="w-full max-w-6xl mx-auto p-4 sm:p-8">
      <div className="mb-8 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-slate-400">
            Publishing Queue
          </h1>
          <p className="text-slate-400 mt-2">Manage your upcoming scheduled posts and drafts.</p>
        </div>
        
        <div className="flex bg-slate-900/60 p-1 rounded-xl border border-slate-800">
          <button 
            onClick={() => setActiveTab('scheduled')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${activeTab === 'scheduled' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-400 hover:text-white hover:bg-slate-800'}`}
          >
            Scheduled
          </button>
          <button 
            onClick={() => setActiveTab('drafts')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${activeTab === 'drafts' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-400 hover:text-white hover:bg-slate-800'}`}
          >
            Drafts
          </button>
          <button 
            onClick={() => setActiveTab('published')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${activeTab === 'published' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-400 hover:text-white hover:bg-slate-800'}`}
          >
            History
          </button>
        </div>
      </div>

      {!loading && jobs.length > 0 && (
        <div className="flex items-center justify-between mb-6 bg-slate-900/40 p-3 rounded-xl border border-slate-800/60">
          <div className="flex items-center gap-3 pl-2">
            <input 
              type="checkbox" 
              checked={selectedJobs.length === jobs.length && jobs.length > 0}
              onChange={(e) => setSelectedJobs(e.target.checked ? jobs.map(j => j._id) : [])}
              className="w-4 h-4 rounded border-slate-700 bg-slate-800 text-indigo-600 focus:ring-indigo-500/20 cursor-pointer"
            />
            <span className="text-sm font-medium text-slate-300">
              {selectedJobs.length > 0 ? `${selectedJobs.length} selected` : 'Select All'}
            </span>
          </div>
          {selectedJobs.length > 0 && (
            <button 
              onClick={handleBulkDelete}
              className="px-3 py-1.5 text-xs font-medium bg-red-500/10 text-red-400 hover:bg-red-500/20 border border-red-500/20 rounded-lg transition-colors flex items-center gap-2"
            >
              <Trash2 className="w-3.5 h-3.5" />
              Delete Selected
            </button>
          )}
        </div>
      )}

      {error && <div className="p-4 mb-6 bg-red-500/10 border border-red-500/20 text-red-400 rounded-xl">{error}</div>}

      {jobs.length === 0 ? (
        <div className="p-16 border-2 border-dashed border-slate-700/60 rounded-3xl text-center flex flex-col items-center">
          <Clock className="w-12 h-12 text-slate-500 mb-4" />
          <h3 className="text-xl font-medium text-slate-300">Queue is empty</h3>
          <p className="text-slate-500 max-w-sm mt-2">You don't have any upcoming posts scheduled.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {jobs.map(job => {
            const platform = platformIcons[job.platform];
            const Icon = platform ? platform.icon : Clock;
            const isFailed = job.status === 'failed';
            
            return (
            <div key={job._id} className="relative">
              <div className={`flex flex-col h-full bg-slate-900/50 backdrop-blur-xl border rounded-2xl p-6 shadow-xl transition-all duration-300 ${isFailed ? 'border-red-500/50 shadow-[0_0_15px_rgba(239,68,68,0.15)] hover:border-red-500/70' : 'border-slate-800/80 hover:border-indigo-500/30'} ${selectedJobs.includes(job._id) ? 'ring-2 ring-indigo-500/50 border-indigo-500/50 bg-slate-800/80' : ''}`}>
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <input 
                      type="checkbox" 
                      checked={selectedJobs.includes(job._id)}
                      onChange={(e) => {
                        if (e.target.checked) setSelectedJobs(prev => [...prev, job._id]);
                        else setSelectedJobs(prev => prev.filter(id => id !== job._id));
                      }}
                      className="w-4 h-4 rounded border-slate-700 bg-slate-800 text-indigo-600 focus:ring-indigo-500/20 cursor-pointer"
                    />
                    <div className={`w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center border border-slate-700 ${platform?.color}`}>
                      <Icon className="w-4 h-4" />
                    </div>
                    <span className="text-sm font-medium text-slate-300 capitalize">{platform?.name || job.platform}</span>
                  </div>
                  <span className={`text-xs font-medium px-2.5 py-1 rounded-full border ${
                    isFailed ? 'bg-red-500/10 text-red-400 border-red-500/20' 
                    : job.status === 'draft' ? 'bg-slate-500/10 text-slate-400 border-slate-500/20' 
                    : job.status === 'published' ? 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20'
                    : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                  }`}>
                    {isFailed ? 'Failed' : job.status === 'draft' ? 'Draft' : job.status === 'published' ? 'Published' : 'Scheduled'}
                  </span>
                </div>

                <div 
                  className="flex-grow mb-4 cursor-pointer group" 
                  onClick={() => setViewingJob(job)}
                >
                  <p className="text-slate-300 text-sm line-clamp-4 group-hover:text-slate-200 transition-colors">{job.post?.content}</p>
                  {job.post?.mediaUrls && job.post.mediaUrls.length > 0 && (
                    <div className="mt-3 flex items-center gap-2 text-xs text-slate-500 bg-slate-800/50 px-2 py-1 rounded w-fit border border-slate-700/50 group-hover:bg-slate-700/50 transition-colors">
                      <ImageIcon className="w-3 h-3" />
                      Media Attached
                    </div>
                  )}
                </div>

                <div className="pt-4 border-t border-slate-800/80 mb-4">
                  <div className="flex items-center gap-2 text-sm text-slate-400">
                    <Clock className="w-4 h-4 text-indigo-400" />
                    {job.scheduledFor ? new Date(job.scheduledFor).toLocaleString(undefined, { 
                      month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' 
                    }) : 'No date set'}
                  </div>
                  {isFailed && job.errorMessage && (
                    <div className="mt-3 p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-xs text-red-400 font-medium">
                      <span className="block font-bold mb-1">Error Details:</span>
                      {job.errorMessage}
                    </div>
                  )}
                </div>

                <div className="flex items-center gap-2 mt-auto">
                  {job.status !== 'published' && job.status !== 'failed' && (
                    <button 
                      onClick={() => handleEditClick(job)}
                      className="flex-1 flex items-center justify-center gap-1.5 py-2 px-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-sm font-medium rounded-xl transition border border-slate-700 hover:border-slate-600"
                    >
                      <Edit2 className="w-4 h-4" /> Edit
                    </button>
                  )}
                  {job.status === 'draft' && (
                    <button 
                      onClick={() => handleEditClick(job)}
                      className="flex-1 flex items-center justify-center gap-1.5 py-2 px-2 bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-400 text-sm font-medium rounded-xl transition border border-indigo-500/20 hover:border-indigo-500/30"
                    >
                      <Calendar className="w-4 h-4" /> Schedule
                    </button>
                  )}
                  <button 
                    onClick={() => handleDelete(job._id)}
                    className="flex items-center justify-center py-2 px-3 bg-red-500/10 hover:bg-red-500/20 text-red-400 text-sm font-medium rounded-xl transition border border-red-500/20 hover:border-red-500/30"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          )
          })}
        </div>
      )}

      {/* Edit Modal */}
      {editingJob && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-700 rounded-3xl p-6 w-full max-w-lg shadow-2xl">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-bold text-white">
                {editingJob.status === 'draft' ? 'Edit Draft' : 'Edit Scheduled Post'}
              </h3>
              <button onClick={() => setEditingJob(null)} className="text-slate-500 hover:text-white transition">
                <X className="w-6 h-6" />
              </button>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-400 mb-2">Post Content</label>
                <textarea
                  value={editContent}
                  onChange={(e) => setEditContent(e.target.value)}
                  className="w-full bg-slate-800 text-white border border-slate-700 rounded-xl p-4 min-h-[120px] focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-slate-400 mb-2">
                  {editingJob.status === 'draft' ? 'Schedule for Later (Optional)' : 'Scheduled Time'}
                </label>
                <input
                  type="datetime-local"
                  value={editDate}
                  onChange={(e) => setEditDate(e.target.value)}
                  className="w-full bg-slate-800 text-white border border-slate-700 rounded-xl p-3 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                />
              </div>
            </div>

            <div className="flex gap-3 mt-8">
              <button
                onClick={() => setEditingJob(null)}
                className="flex-1 py-3 px-2 whitespace-nowrap bg-slate-800 text-white font-semibold rounded-xl hover:bg-slate-700 transition"
              >
                Discard
              </button>
              
              {editingJob.status === 'draft' ? (
                <>
                  <div className="flex-1">
                    <Magnetic>
                      <button
                        onClick={() => handleSaveEdit('save_draft')}
                        disabled={isSaving}
                        className="w-full py-3 px-2 whitespace-nowrap bg-slate-700 text-white font-semibold rounded-xl hover:bg-slate-600 transition disabled:opacity-50"
                      >
                        Save Draft
                      </button>
                    </Magnetic>
                  </div>
                  <div className="flex-1">
                    <Magnetic>
                      <button
                        onClick={() => handleSaveEdit('schedule')}
                        disabled={isSaving || !editDate}
                        className="w-full py-3 px-2 whitespace-nowrap bg-indigo-600 text-white font-semibold rounded-xl hover:bg-indigo-500 transition shadow-[0_0_15px_rgba(79,70,229,0.3)] disabled:opacity-50"
                      >
                        Schedule Post
                      </button>
                    </Magnetic>
                  </div>
                </>
              ) : (
                <div className="flex-1">
                  <Magnetic>
                    <button
                      onClick={() => handleSaveEdit()}
                      disabled={isSaving}
                      className="w-full py-3 px-2 whitespace-nowrap bg-indigo-600 text-white font-semibold rounded-xl hover:bg-indigo-500 transition shadow-[0_0_15px_rgba(79,70,229,0.3)] disabled:opacity-50"
                    >
                      {isSaving ? 'Saving...' : 'Save Changes'}
                    </button>
                  </Magnetic>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* View Modal */}
      {viewingJob && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 sm:p-6 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-slate-900 border border-slate-700 rounded-3xl p-6 sm:p-8 w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl relative animate-in zoom-in-95 duration-200" onClick={e => e.stopPropagation()}>
            <button 
              onClick={() => setViewingJob(null)}
              className="absolute top-4 right-4 p-2 bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white rounded-full transition shadow-md"
            >
              <X className="w-5 h-5" />
            </button>
            <div className="flex items-center gap-4 mb-6">
              <div className={`w-12 h-12 rounded-full bg-slate-800 flex items-center justify-center border border-slate-700 ${platformIcons[viewingJob.platform]?.color}`}>
                {React.createElement(platformIcons[viewingJob.platform]?.icon || Clock, { className: "w-6 h-6" })}
              </div>
              <div>
                <h3 className="text-xl font-bold text-white capitalize">{platformIcons[viewingJob.platform]?.name || viewingJob.platform}</h3>
                <p className="text-sm text-slate-400 font-medium">
                  {viewingJob.status === 'failed' ? 'Failed to Publish' : viewingJob.status === 'draft' ? 'Draft' : viewingJob.status === 'published' ? 'Published' : 'Scheduled'}
                </p>
              </div>
            </div>
            <div className="mb-6">
              <p className="text-slate-200 whitespace-pre-wrap leading-relaxed text-[15px]">{viewingJob.post?.content}</p>
            </div>
            {viewingJob.post?.mediaUrls && viewingJob.post.mediaUrls.length > 0 && (
              <div className="mb-6 space-y-4">
                {viewingJob.post.mediaUrls.map((url, i) => (
                  url.toLowerCase().endsWith('.mp4') ? (
                    <video key={i} src={url} className="w-full rounded-2xl border border-slate-700/80 shadow-lg" controls />
                  ) : (
                    <img key={i} src={url} alt="Attached Media" className="w-full rounded-2xl border border-slate-700/80 shadow-lg" />
                  )
                ))}
              </div>
            )}
            <div className="pt-6 border-t border-slate-800/80">
              <div className="flex items-center gap-2 text-sm text-slate-400 mb-2 font-medium">
                <Clock className="w-4 h-4 text-indigo-400" />
                {viewingJob.scheduledFor ? new Date(viewingJob.scheduledFor).toLocaleString(undefined, { 
                  weekday: 'long', month: 'long', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit' 
                }) : 'No scheduled date'}
              </div>
              {viewingJob.status === 'failed' && viewingJob.errorMessage && (
                <div className="mt-4 p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-sm text-red-400 font-medium">
                  <span className="block font-bold mb-1">Error Details:</span>
                  {viewingJob.errorMessage}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
