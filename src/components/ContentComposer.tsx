import React, { useState } from 'react';
import { FaXTwitter, FaLinkedin, FaFacebook, FaInstagram, FaGoogle, FaTelegram } from 'react-icons/fa6';
import { Image, Calendar, Loader2, X, Sparkles } from 'lucide-react';
import { Magnetic } from './ui/Magnetic';

// Strict Platform Order: Instagram, Facebook, Google Business Profile (GMB), LinkedIn, X (Twitter), Telegram
const platforms = [
  { id: 'telegram', name: 'Telegram', icon: FaTelegram, color: 'text-[#229ED9]', hoverColor: 'group-hover:text-[#229ED9] group-hover:drop-shadow-[0_0_8px_rgba(34,158,217,0.5)]' },
  { id: 'instagram', name: 'Instagram', icon: FaInstagram, color: 'text-[#E4405F]', hoverColor: 'group-hover:text-[#E4405F] group-hover:drop-shadow-[0_0_8px_rgba(228,64,95,0.5)]' },
  { id: 'facebook', name: 'Facebook', icon: FaFacebook, color: 'text-[#1877F2]', hoverColor: 'group-hover:text-[#1877F2] group-hover:drop-shadow-[0_0_8px_rgba(24,119,242,0.5)]' },
  { id: 'gmb', name: 'Google', icon: FaGoogle, color: 'text-[#4285F4]', hoverColor: 'group-hover:text-[#4285F4] group-hover:drop-shadow-[0_0_8px_rgba(66,133,244,0.5)]' },
  { id: 'linkedin', name: 'LinkedIn', icon: FaLinkedin, color: 'text-[#0A66C2]', hoverColor: 'group-hover:text-[#0A66C2] group-hover:drop-shadow-[0_0_8px_rgba(10,102,194,0.5)]' },
  { id: 'twitter', name: 'X', icon: FaXTwitter, color: 'text-white', hoverColor: 'group-hover:text-black dark:group-hover:text-white group-hover:drop-shadow-[0_0_8px_rgba(255,255,255,0.5)]' },
];

const AIWriterModal: React.FC<{ isOpen: boolean; onClose: () => void; onGenerate: (text: string) => void }> = ({ isOpen, onClose, onGenerate }) => {
  const [topic, setTopic] = useState('');
  const [tone, setTone] = useState('professional');
  const [selectedPlatforms, setSelectedPlatforms] = useState<string[]>(['linkedin']);
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleGenerate = async () => {
    if (!topic) return;
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('https://schedulebubble-zjof.onrender.com/api/ai/generate', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        },
        body: JSON.stringify({ topic, tone, platforms: selectedPlatforms }),
        credentials: 'include',
      });
      const data = await response.json();
      if (response.ok) {
        onGenerate(data.content);
        onClose();
      } else {
        alert(data.message || 'Error generating content');
      }
    } catch (err) {
      console.error(err);
      alert('Error generating content');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="bg-white dark:bg-[#0f172a] border border-slate-200 dark:border-slate-700/80 rounded-2xl w-full max-w-md shadow-2xl overflow-hidden p-6 relative">
        <button onClick={onClose} className="absolute top-4 right-4 text-slate-400 hover:text-slate-700 dark:hover:text-white">
          <X className="w-5 h-5" />
        </button>
        <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-indigo-400" />
          AI Post Generator
        </h3>
        
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-500 dark:text-slate-400 mb-1">What's the topic?</label>
            <textarea
              value={topic} onChange={e => setTopic(e.target.value)}
              className="w-full bg-slate-100 dark:bg-slate-900/60 text-slate-900 dark:text-white border border-slate-300 dark:border-slate-700/80 rounded-xl p-3 focus:outline-none focus:ring-2 focus:ring-indigo-500 min-h-[100px]"
              placeholder="E.g., new product launch, hiring announcement..."
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-500 dark:text-slate-400 mb-1">Tone</label>
            <select
              value={tone} onChange={e => setTone(e.target.value)}
              className="w-full bg-slate-100 dark:bg-slate-900/60 text-slate-900 dark:text-white border border-slate-300 dark:border-slate-700/80 rounded-xl p-3 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="professional">Professional</option>
              <option value="casual">Casual</option>
              <option value="enthusiastic">Enthusiastic</option>
              <option value="informative">Informative</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-500 dark:text-slate-400 mb-2">Target Platforms</label>
            <div className="flex flex-wrap gap-2">
              {platforms.map(p => {
                const isSelected = selectedPlatforms.includes(p.id);
                const Icon = p.icon;
                return (
                  <button
                    key={p.id}
                    onClick={() => {
                      setSelectedPlatforms(prev =>
                        prev.includes(p.id)
                          ? prev.filter(id => id !== p.id)
                          : [...prev, p.id]
                      );
                    }}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-sm font-medium transition-all ${
                      isSelected
                        ? 'bg-indigo-50 border-indigo-500 text-indigo-700 dark:bg-indigo-500/20 dark:text-indigo-300'
                        : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    {p.name}
                  </button>
                );
              })}
            </div>
          </div>
          
          <button
            onClick={handleGenerate}
            disabled={loading || !topic}
            className="w-full py-3 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-semibold rounded-xl shadow-[0_0_15px_rgba(79,70,229,0.3)] transition-all flex justify-center items-center gap-2 mt-4"
          >
            {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Generate Content'}
          </button>
        </div>
      </div>
    </div>
  );
};

// ── Library Modal ─────────────────────────────────────────────────────────────
const LibraryModal: React.FC<{ isOpen: boolean; onClose: () => void; onSelect: (url: string) => void }> = ({ isOpen, onClose, onSelect }) => {
  const [assets, setAssets] = useState<{_id: string, fileUrl: string, fileName: string}[]>([]);
  const [loading, setLoading] = useState(true);

  React.useEffect(() => {
    if (isOpen) {
      setLoading(true);
      const token = localStorage.getItem('token');
      const headers: Record<string, string> = {};
      if (token) headers['Authorization'] = `Bearer ${token}`;

      fetch('https://schedulebubble-zjof.onrender.com/api/media', { 
        headers,
        credentials: 'include' 
      })
        .then(res => res.json())
        .then(data => setAssets(Array.isArray(data) ? data : []))
        .catch(err => console.error(err))
        .finally(() => setLoading(false));
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="bg-white dark:bg-[#0f172a] border border-slate-200 dark:border-slate-700/80 rounded-2xl w-full max-w-2xl shadow-2xl overflow-hidden p-6 relative flex flex-col max-h-[80vh]">
        <button onClick={onClose} className="absolute top-4 right-4 text-slate-400 hover:text-slate-700 dark:hover:text-white">
          <X className="w-5 h-5" />
        </button>
        <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
          <Image className="w-5 h-5 text-indigo-400" />
          Select from Library
        </h3>
        
        <div className="flex-grow overflow-y-auto pr-2">
          {loading ? (
            <div className="flex justify-center items-center py-20">
              <Loader2 className="w-8 h-8 text-indigo-500 animate-spin" />
            </div>
          ) : assets.length === 0 ? (
            <div className="text-center py-10 text-slate-500">
              No media found. Go to the Media Vault to upload some!
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {assets.map(asset => (
                <div 
                  key={asset._id} 
                  onClick={() => { onSelect(asset.fileUrl); onClose(); }}
                  className="group relative aspect-square rounded-xl overflow-hidden bg-slate-100 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/50 cursor-pointer"
                >
                  {asset.fileUrl.toLowerCase().endsWith('.mp4') ? (
                    <video src={asset.fileUrl} className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105" muted />
                  ) : (
                    <img src={asset.fileUrl} alt={asset.fileName} className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105" />
                  )}
                  <div className="absolute inset-0 ring-2 ring-transparent group-hover:ring-indigo-500 transition-all rounded-xl" />
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export const ContentComposer = () => {
  const [content, setContent] = useState('');
  const [selectedDestinations, setSelectedDestinations] = useState<{platform: string, profileId?: string}[]>([]);
  const [connectedAccounts, setConnectedAccounts] = useState<any[]>([]);

  React.useEffect(() => {
    const fetchAccounts = async () => {
      try {
        const token = localStorage.getItem('token');
        const res = await fetch('https://schedulebubble-zjof.onrender.com/api/oauth/accounts', {
          headers: token ? { 'Authorization': 'Bearer ' + token } : {},
          credentials: 'include'
        });
        if (res.ok) {
          const data = await res.json();
          setConnectedAccounts(data);
        }
      } catch (err) {
        console.error('Failed to fetch connected accounts', err);
      }
    };
    fetchAccounts();
  }, []);

  const availableDestinations = React.useMemo(() => {
    return platforms.map(p => {
      // Find if we have a connected account for this platform
      let matchedAccount = connectedAccounts.find(acc => 
        acc.platform === p.id || 
        (p.id === 'facebook' && acc.platform === 'meta' && acc.profileName.includes('Facebook')) ||
        (p.id === 'instagram' && acc.platform === 'meta' && acc.profileName.includes('Instagram')) ||
        (p.id === 'twitter' && acc.platform === 'x')
      );
      
      // Fallback for generic meta profile
      if (!matchedAccount && (p.id === 'facebook' || p.id === 'instagram')) {
         matchedAccount = connectedAccounts.find(acc => acc.platform === 'meta');
      }

      return {
        id: p.id,
        profileId: matchedAccount ? matchedAccount._id : undefined,
        platform: p.id,
        name: p.name,
        icon: p.icon,
        color: p.color,
        hoverColor: p.hoverColor
      };
    });
  }, [connectedAccounts]);
  const [media, setMedia] = useState<string | null>(null);
  const [scheduledFor, setScheduledFor] = useState('');
  const [isScheduling, setIsScheduling] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  
  const [isAIModalOpen, setIsAIModalOpen] = useState(false);
  const [isLibraryModalOpen, setIsLibraryModalOpen] = useState(false);

  const maxLength = 280;

  const toggleDestination = (dest: any) => {
    setError('');
    setSelectedDestinations(prev => {
      const exists = prev.find(d => d.id === dest.id);
      if (exists) {
        return prev.filter(d => d.id !== dest.id);
      }
      return [...prev, { platform: dest.platform, profileId: dest.profileId, id: dest.id }];
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!content.trim()) {
      setError('Post content cannot be empty.');
      return;
    }
    if (selectedDestinations.length === 0) {
      setError('Please select at least one platform.');
      return;
    }
    if (isScheduling && !scheduledFor) {
      setError('Please select a date and time for scheduling.');
      return;
    }

    setLoading(true);

    try {
      const token = localStorage.getItem('token');
      const response = await fetch('https://schedulebubble-zjof.onrender.com/api/posts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        },
        body: JSON.stringify({
          content,
          destinations: selectedDestinations,
          mediaUrls: media ? [media] : [],
          scheduledFor: isScheduling ? scheduledFor : undefined,
          status: isScheduling ? 'scheduled' : 'published',
        }),
        credentials: 'include',
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to create post');
      }

      setSuccess('Post successfully created!');
      setContent('');
      setSelectedDestinations([]);
      setScheduledFor('');
      setIsScheduling(false);
      setMedia(null);
    } catch (err: any) {
      setError(err.message || 'Something went wrong.');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveDraft = async () => {
    setError('');
    setSuccess('');

    if (!content.trim()) {
      setError('Post content cannot be empty.');
      return;
    }
    if (selectedDestinations.length === 0) {
      setError('Please select at least one platform for this draft.');
      return;
    }

    setLoading(true);

    try {
      const token = localStorage.getItem('token');
      const response = await fetch('https://schedulebubble-zjof.onrender.com/api/posts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        },
        body: JSON.stringify({
          content,
          destinations: selectedDestinations,
          mediaUrls: media ? [media] : [],
          status: 'draft',
        }),
        credentials: 'include',
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to save draft');
      }

      setSuccess('Draft successfully saved!');
      setContent('');
      setSelectedDestinations([]);
      setScheduledFor('');
      setIsScheduling(false);
      setMedia(null);
    } catch (err: any) {
      setError(err.message || 'Something went wrong.');
    } finally {
      setLoading(false);
    }
  };

  const isInstagramMissingMedia = selectedDestinations.some(d => d.platform === 'instagram') && !media;

  return (
    <>
      <div
        className="w-full max-w-4xl mx-auto rounded-3xl border border-slate-200 dark:border-slate-800/80 backdrop-blur-2xl shadow-2xl overflow-hidden hover:border-indigo-500/20 transition-all duration-300 bg-white/80 dark:bg-[rgba(13,18,32,0.7)]"
      >
        <div className="p-8">
          <h2 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-slate-900 to-slate-500 dark:from-white dark:to-slate-400 mb-6 tracking-tight">Create Post</h2>
          
          <form onSubmit={handleSubmit}>
            {/* Platform Selector */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-slate-500 dark:text-slate-400 mb-3">Publish to</label>
              <div className="flex flex-wrap gap-3">
                {availableDestinations.map(dest => {
                  const isSelected = selectedDestinations.some(d => d.id === dest.id);
                  const Icon = dest.icon;
                  return (
                    <Magnetic key={dest.id || dest.platform}>
                      <button
                        type="button"
                        onClick={() => toggleDestination(dest)}
                        className={`group flex items-center gap-2 px-5 py-2.5 rounded-xl border transition-all duration-300 hover:scale-[1.02] ${
                          isSelected 
                            ? 'bg-slate-700 border-indigo-500 shadow-[0_0_15px_rgba(99,102,241,0.2)]' 
                            : 'bg-slate-100 dark:bg-slate-900/50 border-slate-300 dark:border-slate-700 hover:border-slate-400 dark:hover:border-slate-500 hover:bg-slate-200 dark:hover:bg-slate-800'
                        }`}
                      >
                        <Icon className={`w-4 h-4 transition-all duration-300 ${isSelected ? dest.color + ' drop-shadow-[0_0_8px_currentColor]' : 'text-slate-400 dark:text-slate-500 ' + dest.hoverColor}`} />
                        <span className={`text-sm font-semibold transition-colors duration-300 ${isSelected ? 'text-white' : 'text-slate-500 dark:text-slate-400 group-hover:text-slate-700 dark:group-hover:text-slate-200'}`}>
                          {dest.name}
                        </span>
                      </button>
                    </Magnetic>
                  );
                })}
              </div>
              
              
            </div>

            {/* Text Area */}
            <div className="mb-4 relative group">
              <textarea
                value={content}
                onChange={(e) => { setContent(e.target.value); setError(''); }}
                placeholder="What do you want to share today?"
                className="w-full bg-slate-100 dark:bg-slate-900/60 text-slate-900 dark:text-white border border-slate-300 dark:border-slate-700/80 rounded-2xl p-5 min-h-[180px] focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent resize-y transition-all placeholder:text-slate-400 dark:placeholder:text-slate-500 shadow-inner"
              />
              {media && (
                <div className="relative mt-2 inline-block">
                  {media.toLowerCase().endsWith('.mp4') ? (
                    <video src={media} className="h-32 w-auto rounded-lg border border-slate-300 dark:border-slate-700/80 shadow-md object-cover" autoPlay muted loop />
                  ) : (
                    <img src={media} alt="Preview" className="h-32 w-auto rounded-lg border border-slate-300 dark:border-slate-700/80 shadow-md object-cover" />
                  )}
                  <button
                    type="button"
                    onClick={() => setMedia(null)}
                    className="absolute -top-2 -right-2 bg-slate-200 dark:bg-slate-800 text-slate-500 dark:text-slate-300 hover:text-red-500 dark:hover:text-white p-1.5 rounded-full border border-slate-300 dark:border-slate-600 shadow-lg hover:bg-slate-300 dark:hover:bg-slate-700 transition"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}
              <div className={`absolute bottom-5 right-5 text-xs font-semibold px-2 py-1 rounded-md backdrop-blur-sm ${content.length > 260 ? 'text-red-500 bg-red-50 dark:text-red-400 dark:bg-red-400/10' : 'text-slate-400 bg-slate-100/80 dark:bg-slate-800/80'}`}>
                {content.length} / {maxLength}
              </div>
            </div>

            {/* Scheduling Options */}
            {isScheduling && (
              <div className="mb-6 animate-in slide-in-from-top-2 fade-in duration-300">
                <label className="block text-sm font-medium text-slate-500 dark:text-slate-400 mb-2">Schedule for</label>
                <input
                  type="datetime-local"
                  value={scheduledFor}
                  onChange={(e) => setScheduledFor(e.target.value)}
                  className="bg-slate-100 dark:bg-slate-900/60 text-slate-900 dark:text-white border border-slate-300 dark:border-slate-700/80 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-indigo-500 w-full sm:w-auto"
                />
              </div>
            )}

            {/* Error and Success Messages */}
            {isInstagramMissingMedia && <div className="mb-5 p-4 bg-orange-500/10 border border-orange-500/20 rounded-xl text-orange-400 text-sm font-medium">Instagram requires an image or video to publish.</div>}
            {error && <div className="mb-5 p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-sm font-medium">{error}</div>}
            {success && <div className="mb-5 p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-emerald-400 text-sm font-medium">{success}</div>}

            {/* Action Toolbar */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between pt-5 border-t border-slate-200 dark:border-slate-700/50 gap-4 sm:gap-0">
              <div className="flex gap-2">
                <Magnetic pull={0.1}>
                  <button
                    type="button"
                    onClick={() => setIsLibraryModalOpen(true)}
                    className="p-3 text-slate-400 hover:text-indigo-400 hover:bg-indigo-500/10 rounded-xl transition-all duration-300 group"
                    title="Select from Library"
                  >
                    <Image className="w-5 h-5 group-hover:scale-[1.05] transition-transform" />
                  </button>
                </Magnetic>
                <Magnetic pull={0.1}>
                  <button
                    type="button"
                    onClick={() => {
                      setIsScheduling(!isScheduling);
                      if (isScheduling) setScheduledFor('');
                    }}
                    className={`p-3 rounded-xl transition-all duration-300 flex items-center gap-2 ${
                      isScheduling 
                        ? 'text-indigo-400 bg-indigo-500/10 shadow-inner' 
                        : 'text-slate-400 hover:text-indigo-400 hover:bg-indigo-500/10'
                    }`}
                    title="Schedule post"
                  >
                    <Calendar className="w-5 h-5" />
                    <span className="text-sm font-semibold">Schedule</span>
                  </button>
                </Magnetic>
                <Magnetic pull={0.1}>
                  <button
                    type="button"
                    onClick={() => setIsAIModalOpen(true)}
                    className="p-3 rounded-xl transition-all duration-300 flex items-center gap-2 text-indigo-400 hover:text-indigo-300 bg-indigo-500/10 hover:bg-indigo-500/20"
                    title="Generate with AI"
                  >
                    <Sparkles className="w-5 h-5" />
                    <span className="text-sm font-semibold">AI Writer</span>
                  </button>
                </Magnetic>
              </div>

              <Magnetic pull={0.15}>
                <div className="flex items-center gap-3 w-full sm:w-auto">
                  <button
                    type="button"
                    disabled={loading || isInstagramMissingMedia}
                    onClick={handleSaveDraft}
                    className="flex items-center justify-center gap-2 px-6 py-3 bg-transparent hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-300 dark:border-slate-600 disabled:opacity-50 disabled:cursor-not-allowed font-semibold rounded-xl transition-all duration-300 w-full sm:w-auto"
                  >
                    Save Draft
                  </button>
                  <button
                    type="submit"
                    disabled={loading || isInstagramMissingMedia}
                    className="flex items-center justify-center gap-2 px-8 py-3 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold rounded-xl shadow-[0_0_15px_rgba(79,70,229,0.3)] hover:shadow-[0_0_25px_rgba(79,70,229,0.5)] hover:-translate-y-0.5 transition-all duration-300 w-full sm:w-auto"
                  >
                    {loading && <Loader2 className="w-4 h-4 animate-spin" />}
                    {isScheduling ? 'Schedule Post' : 'Post Now'}
                  </button>
                </div>
              </Magnetic>
            </div>
          </form>
        </div>
      </div>
      
      <AIWriterModal 
        isOpen={isAIModalOpen} 
        onClose={() => setIsAIModalOpen(false)} 
        onGenerate={(text) => {
          setContent(prev => prev ? `${prev}\n\n${text}` : text);
        }}
      />

      <LibraryModal
        isOpen={isLibraryModalOpen}
        onClose={() => setIsLibraryModalOpen(false)}
        onSelect={(url) => setMedia(url)}
      />
    </>
  );
};

export default ContentComposer;

