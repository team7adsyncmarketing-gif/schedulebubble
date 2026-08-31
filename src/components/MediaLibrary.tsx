import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Upload, Image as ImageIcon, Video, Loader2, Plus, Trash2, X } from 'lucide-react';
import { Magnetic } from './ui/Magnetic';

interface MediaAsset {
  _id: string;
  fileUrl: string;
  fileName: string;
  createdAt: string;
}

export const MediaLibrary: React.FC = () => {
  const [assets, setAssets] = useState<MediaAsset[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const [previewAsset, setPreviewAsset] = useState<MediaAsset | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const fetchAssets = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        setError('Not authorized, no token');
        setLoading(false);
        return;
      }

      const res = await fetch('https://schedulebubble-zjof.onrender.com/api/media', {
        headers: {
          'Authorization': `Bearer ${token}`
        },
        credentials: 'include',
      });
      if (res.ok) {
        const data = await res.json();
        setAssets(data);
      } else {
        setError('Failed to fetch media assets');
      }
    } catch (err) {
      console.error(err);
      setError('Error connecting to server');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAssets();
  }, []);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    setError('');

    const formData = new FormData();
    formData.append('image', file);

    try {
      const token = localStorage.getItem('token');
      if (!token) {
        setError('Not authorized, no token');
        setUploading(false);
        return;
      }

      const res = await fetch('https://schedulebubble-zjof.onrender.com/api/media/upload', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData,
        credentials: 'include',
      });

      if (res.ok) {
        const newAsset = await res.json();
        setAssets([newAsset, ...assets]);
      } else {
        const data = await res.json();
        setError(data.message || 'Upload failed');
      }
    } catch (err) {
      console.error(err);
      setError('Error uploading file');
    } finally {
      setUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const token = localStorage.getItem('token');
      if (!token) return;

      const res = await fetch(`https://schedulebubble-zjof.onrender.com/api/media/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        credentials: 'include',
      });

      if (res.ok) {
        setAssets(assets.filter(asset => asset._id !== id));
      } else {
        const data = await res.json();
        setError(data.message || 'Delete failed');
      }
    } catch (err) {
      console.error(err);
      setError('Error deleting file');
    }
  };

  return (
    <div className="w-full rounded-3xl border border-slate-200 dark:border-slate-800/80 backdrop-blur-2xl shadow-2xl overflow-hidden hover:border-indigo-500/20 transition-all duration-300 bg-white/80 dark:bg-[rgba(13,18,32,0.7)] p-8">
      
      <div className="flex flex-col sm:flex-row items-center justify-between mb-8 gap-4">
        <div>
          <h2 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-slate-900 to-slate-500 dark:from-white dark:to-slate-400 tracking-tight flex items-center gap-3">
            <ImageIcon className="w-7 h-7 text-indigo-500" />
            Media Vault
          </h2>
          <p className="text-slate-500 dark:text-slate-400 mt-2">Manage your visual assets for publishing.</p>
        </div>
        
        <div>
          <input 
            type="file" 
            ref={fileInputRef} 
            onChange={handleUpload} 
            accept="image/*,video/mp4,video/mov,video/avi,video/webm" 
            className="hidden" 
          />
          <Magnetic>
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
              className="flex items-center gap-2 px-6 py-3 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold rounded-xl shadow-[0_0_15px_rgba(79,70,229,0.3)] transition-all disabled:opacity-50"
            >
              {uploading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Upload className="w-5 h-5" />}
              {uploading ? 'Uploading...' : 'Upload Media'}
            </button>
          </Magnetic>
        </div>
      </div>

      {error && <div className="mb-6 p-4 bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 rounded-xl text-red-600 dark:text-red-400 text-sm font-medium">{error}</div>}

      {loading ? (
        <div className="flex justify-center items-center py-20">
          <Loader2 className="w-8 h-8 text-indigo-500 animate-spin" />
        </div>
      ) : assets.length === 0 ? (
        <div className="border-2 border-dashed border-slate-300 dark:border-slate-700/60 rounded-2xl p-16 flex flex-col items-center justify-center text-center">
          <div className="w-16 h-16 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center mb-4">
            <ImageIcon className="w-8 h-8 text-slate-400" />
          </div>
          <h3 className="text-lg font-semibold text-slate-700 dark:text-slate-300 mb-1">No media yet</h3>
          <p className="text-slate-500 dark:text-slate-500 max-w-sm">Upload your first image to start building your media library.</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {assets.map((asset) => {
            const imageUrl = asset.fileUrl.startsWith('http') ? asset.fileUrl : `https://schedulebubble-zjof.onrender.com${asset.fileUrl.startsWith('/') ? '' : '/'}${asset.fileUrl}`;
            return (
              <div 
                key={asset._id} 
                onClick={() => setPreviewAsset(asset)}
                className="group relative aspect-square rounded-xl overflow-hidden bg-slate-100 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/50 cursor-pointer"
              >
                {asset.fileUrl.includes('.mp4') || asset.fileUrl.includes('.mov') || asset.fileUrl.includes('.webm') || asset.fileUrl.includes('/video/') ? (
                  <>
                    <video 
                      src={imageUrl}
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                      muted
                      playsInline
                      onMouseEnter={e => (e.currentTarget as HTMLVideoElement).play()}
                      onMouseLeave={e => { (e.currentTarget as HTMLVideoElement).pause(); (e.currentTarget as HTMLVideoElement).currentTime = 0; }}
                    />
                    <div className="absolute top-2 left-2 px-2 py-1 bg-black/60 backdrop-blur-md rounded-md flex items-center gap-1.5 z-10 border border-white/10 shadow-sm">
                      <Video className="w-3 h-3 text-indigo-400" />
                      <span className="text-[10px] font-bold tracking-wider uppercase text-white">Video</span>
                    </div>
                  </>
                ) : (
                  <>
                    <img 
                      src={imageUrl} 
                      alt={asset.fileName} 
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                    />
                    <div className="absolute top-2 left-2 px-2 py-1 bg-black/60 backdrop-blur-md rounded-md flex items-center gap-1.5 z-10 border border-white/10 shadow-sm">
                      <ImageIcon className="w-3 h-3 text-emerald-400" />
                      <span className="text-[10px] font-bold tracking-wider uppercase text-white">
                        {asset.fileName.split('.').pop() || 'Image'}
                      </span>
                    </div>
                  </>
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col justify-between p-3 z-20">
                  <div className="flex justify-end">
                    <button
                      onClick={(e) => { e.stopPropagation(); handleDelete(asset._id); }}
                      className="p-2 bg-red-500/80 hover:bg-red-600 text-white rounded-lg backdrop-blur-sm transition-colors"
                      title="Delete asset"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                  <p className="text-white text-xs font-medium truncate w-full shadow-sm">{asset.fileName}</p>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Preview Modal */}
      <AnimatePresence>
        {previewAsset && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-8">
            <motion.div 
              initial={{ opacity: 0 }} 
              animate={{ opacity: 1 }} 
              exit={{ opacity: 0 }} 
              className="absolute inset-0 bg-black/80 backdrop-blur-sm"
              onClick={() => setPreviewAsset(null)}
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }} 
              animate={{ opacity: 1, scale: 1 }} 
              exit={{ opacity: 0, scale: 0.95 }} 
              className="relative z-10 w-full max-w-5xl max-h-full flex flex-col items-center justify-center pointer-events-none"
            >
              <button 
                onClick={() => setPreviewAsset(null)}
                className="pointer-events-auto absolute -top-12 right-0 p-2 text-white/70 hover:text-white bg-white/10 hover:bg-white/20 rounded-full transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
              
              {previewAsset.fileUrl.includes('.mp4') || previewAsset.fileUrl.includes('.mov') || previewAsset.fileUrl.includes('.webm') || previewAsset.fileUrl.includes('/video/') ? (
                <video 
                  src={previewAsset.fileUrl.startsWith('http') ? previewAsset.fileUrl : `https://schedulebubble-zjof.onrender.com${previewAsset.fileUrl.startsWith('/') ? '' : '/'}${previewAsset.fileUrl}`}
                  className="max-w-full max-h-[85vh] object-contain rounded-lg shadow-2xl pointer-events-auto"
                  controls
                  autoPlay
                />
              ) : (
                <img 
                  src={previewAsset.fileUrl.startsWith('http') ? previewAsset.fileUrl : `https://schedulebubble-zjof.onrender.com${previewAsset.fileUrl.startsWith('/') ? '' : '/'}${previewAsset.fileUrl}`}
                  alt={previewAsset.fileName} 
                  className="max-w-full max-h-[85vh] object-contain rounded-lg shadow-2xl bg-black/50 pointer-events-auto"
                />
              )}
              <div className="mt-4 text-white text-sm font-medium bg-black/50 px-4 py-2 rounded-full backdrop-blur-md border border-white/10 pointer-events-auto">
                {previewAsset.fileName}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
