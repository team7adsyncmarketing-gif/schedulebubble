import { useEffect, useState } from 'react';
import { Calendar, Clock, Image as ImageIcon, Filter, X } from 'lucide-react';
import { FaXTwitter, FaLinkedin, FaFacebook, FaInstagram, FaGoogle, FaTelegram } from 'react-icons/fa6';

interface ScheduledPost {
  _id: string;
  content: string;
  platforms: string[];
  status: string;
  scheduledFor: string | null;
  mediaUrls: string[];
  createdAt: string;
}

const platformIcons: Record<string, { icon: any, color: string }> = {
  telegram: { icon: FaTelegram, color: 'text-[#229ED9]' },
  instagram: { icon: FaInstagram, color: 'text-[#E4405F]' },
  facebook: { icon: FaFacebook, color: 'text-[#1877F2]' },
  google: { icon: FaGoogle, color: 'text-[#4285F4]' },
  linkedin: { icon: FaLinkedin, color: 'text-[#0A66C2]' },
  twitter: { icon: FaXTwitter, color: 'text-white' },
};

export const ScheduleCalendar = () => {
  const [posts, setPosts] = useState<ScheduledPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState<string>('');
  const [viewingJob, setViewingJob] = useState<ScheduledPost | null>(null);

  useEffect(() => {
    const fetchPosts = async () => {
      try {
        const token = localStorage.getItem('token');
        const response = await fetch('https://schedulebubble.onrender.com/api/analytics/calendar', {
          headers: token ? { 'Authorization': `Bearer ${token}` } : {},
          credentials: 'include',
        });
        if (response.ok) {
          const data = await response.json();
          setPosts(data);
        }
      } catch (err) {
        console.error('Failed to fetch calendar', err);
      } finally {
        setLoading(false);
      }
    };
    fetchPosts();
  }, []);

  if (loading) {
    return <div className="text-slate-400 text-sm p-8 text-center animate-pulse">Loading schedule...</div>;
  }



  const filteredPosts = posts.filter(post => {
    if (!selectedDate) return false;
    const dateToCheck = post.scheduledFor ? new Date(post.scheduledFor) : new Date(post.createdAt);
    const filterDate = new Date(selectedDate);
    // Compare YYYY-MM-DD
    return dateToCheck.toDateString() === filterDate.toDateString();
  });

  return (
    <div className="w-full max-w-4xl mx-auto">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-6 gap-4">
        <h2 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-slate-900 to-slate-500 dark:from-white dark:to-slate-400 tracking-tight">
          Content Calendar
        </h2>
        <div className="flex items-center gap-3">
          <div className="relative">
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="pl-9 pr-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-sm text-slate-300 focus:outline-none focus:border-indigo-500"
            />
            <Filter className="absolute left-3 top-2.5 w-4 h-4 text-slate-500" />
          </div>
          {selectedDate && (
            <button
              onClick={() => setSelectedDate('')}
              className="flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-slate-400 bg-slate-800 hover:bg-slate-700 hover:text-white rounded-lg transition-colors border border-slate-700"
            >
              <X className="w-4 h-4" /> View All
            </button>
          )}
        </div>
      </div>

      <div className="space-y-4">
        {!selectedDate ? (
          <div className="text-center py-16 text-slate-500 dark:text-slate-400 bg-slate-50 dark:bg-slate-900/50 rounded-2xl border border-slate-200 dark:border-slate-800 border-dashed shadow-sm">
            <Calendar className="w-8 h-8 mx-auto mb-3 opacity-50" />
            <p>Select a date to view your content schedule.</p>
          </div>
        ) : posts.length === 0 ? (
          <div className="text-center py-16 text-slate-500 dark:text-slate-400 bg-slate-50 dark:bg-slate-900/50 rounded-2xl border border-slate-200 dark:border-slate-800 border-dashed shadow-sm">
            <Calendar className="w-8 h-8 mx-auto mb-3 opacity-50" />
            <p>No upcoming posts. Use the content composer to schedule your first post.</p>
          </div>
        ) : filteredPosts.length === 0 ? (
          <div className="text-center py-16 text-slate-500 dark:text-slate-400 bg-slate-50 dark:bg-slate-900/50 rounded-2xl border border-slate-200 dark:border-slate-800 border-dashed shadow-sm">
            <Calendar className="w-8 h-8 mx-auto mb-3 opacity-50" />
            <p>No posts scheduled for this date.</p>
          </div>
        ) : filteredPosts.map((post) => {
          const date = post.scheduledFor ? new Date(post.scheduledFor) : new Date(post.createdAt);
          const isScheduled = post.status === 'scheduled';

          return (
            <div 
              key={post._id} 
              onClick={() => setViewingJob(post)}
              className="group p-6 rounded-3xl border border-slate-800/60 backdrop-blur-2xl hover:border-slate-700/80 transition-all duration-300 shadow-lg flex flex-col md:flex-row gap-6 hover:scale-[1.01] cursor-pointer"
              style={{ background: 'rgba(13,18,32,0.7)' }}
            >
              <div className="flex-grow">
                <div className="flex items-center gap-2 mb-3">
                  {isScheduled ? (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                      <Clock className="w-3.5 h-3.5" />
                      Scheduled for {date.toLocaleString()}
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                      Published on {date.toLocaleDateString()}
                    </span>
                  )}
                </div>
                
                <p className="text-slate-300 text-sm leading-relaxed mb-4 line-clamp-3">
                  {post.content}
                </p>

                <div className="flex items-center gap-4 mt-auto">
                  <div className="flex -space-x-2">
                    {post.platforms.map((platformId, i) => {
                      const platform = platformIcons[platformId];
                      if (!platform) return null;
                      const Icon = platform.icon;
                      return (
                        <div key={`${post._id}-${platformId}`} className={`w-8 h-8 rounded-full flex items-center justify-center bg-slate-900 border-2 border-slate-800 ${platform.color}`} style={{ zIndex: 10 - i }}>
                          <Icon className="w-3.5 h-3.5" />
                        </div>
                      );
                    })}
                  </div>
                  {post.mediaUrls && post.mediaUrls.length > 0 && (
                    <div className="flex items-center gap-1.5 text-xs font-medium text-slate-400 bg-slate-900/50 px-2 py-1 rounded-md">
                      <ImageIcon className="w-3.5 h-3.5" />
                      Media Attached
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

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
              <div className="flex -space-x-2">
                {viewingJob.platforms.map((platformId, i) => {
                  const platform = platformIcons[platformId];
                  if (!platform) return null;
                  const Icon = platform.icon;
                  return (
                    <div key={`modal-${viewingJob._id}-${platformId}`} className={`w-10 h-10 rounded-full flex items-center justify-center border-2 border-slate-700 bg-slate-800 ${platform.color}`} style={{ zIndex: 10 - i }}>
                      <Icon className="w-4 h-4" />
                    </div>
                  );
                })}
              </div>
              <div>
                <h3 className="text-xl font-bold text-white capitalize">{viewingJob.platforms.map(p => platformIcons[p]?.icon.name || p).join(', ')}</h3>
                <p className="text-sm text-slate-400 font-medium">
                  {viewingJob.status === 'scheduled' ? 'Scheduled' : 'Published'}
                </p>
              </div>
            </div>
            <div className="mb-6">
              <p className="text-slate-200 whitespace-pre-wrap leading-relaxed text-[15px]">{viewingJob.content}</p>
            </div>
            {viewingJob.mediaUrls && viewingJob.mediaUrls.length > 0 && (
              <div className="mb-6 space-y-4">
                {viewingJob.mediaUrls.map((url, i) => (
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
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
