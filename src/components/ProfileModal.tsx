import React, { useState, useRef } from 'react';
import { X, User, LogOut, Camera, Link, Unlink } from 'lucide-react';
import { FaXTwitter, FaLinkedin, FaFacebook, FaInstagram, FaGoogle, FaTelegram } from 'react-icons/fa6';

interface ProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: any;
  onUserUpdate: (user: any) => void;
  onLogout: () => void;
}

const platforms = [
  { id: 'telegram', name: 'Telegram', icon: FaTelegram, color: 'text-[#229ED9]' },
  { id: 'instagram', name: 'Instagram', icon: FaInstagram, color: 'text-[#E4405F]' },
  { id: 'facebook', name: 'Facebook', icon: FaFacebook, color: 'text-[#1877F2]' },
  { id: 'gmb', name: 'Google', icon: FaGoogle, color: 'text-[#4285F4]' },
  { id: 'linkedin', name: 'LinkedIn', icon: FaLinkedin, color: 'text-[#0A66C2]' },
  { id: 'twitter', name: 'X', icon: FaXTwitter, color: 'text-slate-800 dark:text-slate-200' },
  { id: 'meta', name: 'Meta (FB & IG)', icon: FaFacebook, color: 'text-[#1877F2]' },
  { id: 'x', name: 'X (Twitter)', icon: FaXTwitter, color: 'text-slate-800 dark:text-slate-200' },
];

export const ProfileModal: React.FC<ProfileModalProps> = ({ isOpen, onClose, user, onUserUpdate, onLogout }) => {
  const [name, setName] = useState(user?.name || '');
  const [loading, setLoading] = useState(false);
  const [accounts, setAccounts] = useState<any[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  React.useEffect(() => {
    setName(user?.name || '');
    if (isOpen) {
      fetchAccounts();
    }
  }, [user, isOpen]);

  const fetchAccounts = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('https://schedulebubble.onrender.com/api/oauth/accounts', {
        headers: token ? { 'Authorization': `Bearer ${token}` } : {},
        credentials: 'include',
      });
      if (response.ok) {
        const data = await response.json();
        setAccounts(data);
      }
    } catch (err) {
      console.error('Failed to fetch accounts:', err);
    }
  };

  const handleProfilePictureUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const token = localStorage.getItem('token');
    if (!token) return;

    const formData = new FormData();
    formData.append('image', file);

    try {
      const response = await fetch('https://schedulebubble.onrender.com/api/users/profile-picture', {
        method: 'PUT',
        headers: { 'Authorization': `Bearer ${token}` },
        body: formData
      });

      if (response.ok) {
        const updatedUser = await response.json();
        onUserUpdate(updatedUser);
      } else {
        alert('Failed to upload profile picture');
      }
    } catch (error) {
      console.error('Error uploading profile picture:', error);
    }
  };

  const handleUpdateName = async () => {
    if (!name || name === user?.name) return;
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('https://schedulebubble.onrender.com/api/auth/update-profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        },
        body: JSON.stringify({ name }),
      });
      if (response.ok) {
        const updatedUser = await response.json();
        onUserUpdate({ ...user, name: updatedUser.name });
        alert('Name saved successfully!');
      } else {
        alert('Failed to save name');
      }
    } catch (err) {
      console.error(err);
      alert('An error occurred while saving');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <>
      <div className="fixed inset-0 z-[60] bg-black/60 backdrop-blur-sm transition-opacity" onClick={onClose} />
      <div className="fixed inset-y-0 right-0 z-[70] w-full max-w-sm bg-white dark:bg-[#0f172a] shadow-2xl border-l border-slate-200 dark:border-slate-800/80 animate-in slide-in-from-right duration-300 flex flex-col">
        {/* Header */}
        <div className="px-6 py-5 border-b border-slate-200 dark:border-slate-800/80 flex items-center justify-between">
          <h2 className="text-lg font-bold text-slate-900 dark:text-white">Profile Settings</h2>
          <button onClick={onClose} className="p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 transition-colors">
            <X size={18} />
          </button>
        </div>

        <div className="flex-grow overflow-y-auto p-6 space-y-8">
          {/* Avatar Section */}
          <div className="flex flex-col items-center">
            <div className="relative group cursor-pointer" onClick={() => fileInputRef.current?.click()}>
              {user?.profilePicture ? (
                <img src={user.profilePicture} alt="Profile" className="w-24 h-24 rounded-full object-cover border-4 border-slate-100 dark:border-slate-800" />
              ) : (
                <div className="w-24 h-24 rounded-full bg-gradient-to-br from-indigo-500 to-fuchsia-500 flex items-center justify-center border-4 border-slate-100 dark:border-slate-800 text-white text-3xl font-bold uppercase">
                  {user?.name ? user.name.charAt(0) : <User size={40} />}
                </div>
              )}
              <div className="absolute inset-0 bg-black/40 rounded-full opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                <Camera className="text-white w-6 h-6" />
              </div>
            </div>
            <input type="file" ref={fileInputRef} onChange={handleProfilePictureUpload} accept="image/*" className="hidden" />
            <div className="mt-3 text-center">
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">{user?.name}</h3>
              <p className="text-sm text-slate-500 dark:text-slate-400">{user?.email}</p>
            </div>
          </div>

          {/* Edit Info */}
          <div className="space-y-3">
            <label className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">Display Name</label>
            <div className="flex gap-2">
              <input
                type="text"
                value={name}
                onChange={e => setName(e.target.value)}
                className="flex-grow bg-slate-100 dark:bg-slate-900/60 text-slate-900 dark:text-white border border-slate-300 dark:border-slate-700/80 rounded-xl px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
              <button
                onClick={handleUpdateName}
                disabled={loading || name === user?.name}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white rounded-xl text-sm font-semibold transition-colors"
              >
                Save
              </button>
            </div>
          </div>

          {/* Connected Accounts */}
          <div className="space-y-3">
            <label className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">Connected Accounts</label>
            <div className="space-y-2">
              {accounts.length === 0 ? (
                <p className="text-sm text-slate-500">No accounts connected.</p>
              ) : (
                accounts.map(acc => {
                  const p = platforms.find(pl => pl.id === acc.platform);
                  const Icon = p?.icon || Link;
                  return (
                    <div key={acc._id} className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                      <div className="flex items-center gap-3">
                        <Icon className={`w-5 h-5 ${p?.color || 'text-slate-500'}`} />
                        <div>
                          <p className="text-sm font-semibold text-slate-900 dark:text-white">{p?.name || acc.platform}</p>
                          <p className="text-xs text-slate-500 truncate max-w-[150px]">{acc.profileName}</p>
                        </div>
                      </div>
                      <div className="w-2 h-2 rounded-full bg-emerald-500"></div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-6 border-t border-slate-200 dark:border-slate-800/80 bg-slate-50 dark:bg-slate-900/50">
          <button
            onClick={onLogout}
            className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl text-sm font-bold text-red-500 bg-red-50 hover:bg-red-100 dark:bg-red-500/10 dark:hover:bg-red-500/20 border border-red-200 dark:border-red-500/20 transition-colors"
          >
            <LogOut size={16} /> Logout
          </button>
        </div>
      </div>
    </>
  );
};

export default ProfileModal;
