import { useEffect, useState } from 'react';
import { Plus, Unlink } from 'lucide-react';
import { FaXTwitter, FaLinkedin, FaFacebook, FaInstagram, FaGoogle, FaTelegram } from 'react-icons/fa6';

interface ConnectedAccount {
  _id: string;
  platform: string;
  profileId: string;
  profileName: string;
  createdAt: string;
}

const platforms = [
  { id: 'instagram', name: 'Instagram', icon: FaInstagram, color: 'hover:text-[#E4405F] hover:bg-[#E4405F]/10' },
  { id: 'facebook', name: 'Facebook', icon: FaFacebook, color: 'hover:text-[#1877F2] hover:bg-[#1877F2]/10' },
  { id: 'google', name: 'Google Business Profile', icon: FaGoogle, color: 'hover:text-[#4285F4] hover:bg-[#4285F4]/10' },
  { id: 'linkedin', name: 'LinkedIn', icon: FaLinkedin, color: 'hover:text-[#0A66C2] hover:bg-[#0A66C2]/10' },
  { id: 'twitter', name: 'X (Twitter)', icon: FaXTwitter, color: 'hover:text-white hover:bg-slate-700' },
  { id: 'telegram', name: 'Telegram', icon: FaTelegram, color: 'hover:text-[#229ED9] hover:bg-[#229ED9]/10' },
];

export const IntegrationsPanel = () => {
  const [connectedAccounts, setConnectedAccounts] = useState<ConnectedAccount[]>([]);
  const [loading, setLoading] = useState(true);
  const [manualMetaModalOpen, setManualMetaModalOpen] = useState(false);
  const [metaToken, setMetaToken] = useState('');
  const [metaProfileId, setMetaProfileId] = useState('');

  const [manualTwitterModalOpen, setManualTwitterModalOpen] = useState(false);
  const [twitterToken, setTwitterToken] = useState('');

  const [manualGoogleModalOpen, setManualGoogleModalOpen] = useState(false);
  const [googleToken, setGoogleToken] = useState('');
  const [googleAccountId, setGoogleAccountId] = useState('');
  const [googleLocationId, setGoogleLocationId] = useState('');

  const fetchAccounts = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('https://schedulebubble-zjof.onrender.com/api/oauth/accounts', {
        headers: token ? { 'Authorization': `Bearer ${token}` } : {},
        credentials: 'include',
      });
      if (!response.ok) {
        throw new Error('Failed to fetch accounts');
      }
      const data = await response.json();
      setConnectedAccounts(data);
    } catch (err) {
      console.error('Failed to fetch accounts:', err);
      // Gracefully fall back to an empty state (Not Connected)
      setConnectedAccounts([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAccounts();
  }, []);

  const handleManualMetaConnect = async () => {
    if (!metaToken || !metaProfileId) return alert('Token and ID are required');
    const token = localStorage.getItem('token');

    try {
      const response = await fetch(`https://schedulebubble-zjof.onrender.com/api/oauth/meta-manual`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        },
        body: JSON.stringify({ accessToken: metaToken, profileId: metaProfileId }),
        credentials: 'include',
      });
      if (response.ok) {
        setManualMetaModalOpen(false);
        setMetaToken('');
        setMetaProfileId('');
        fetchAccounts();
      } else {
        const data = await response.json();
        alert(data.message || 'Failed to connect manually');
      }
    } catch (e) {
      alert('Error connecting manually');
    }
  };

  const handleManualTwitterConnect = async () => {
    if (!twitterToken) return alert('Token is required');
    const token = localStorage.getItem('token');
    try {
      const response = await fetch(`https://schedulebubble-zjof.onrender.com/api/oauth/twitter-manual`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        },
        body: JSON.stringify({ accessToken: twitterToken }),
        credentials: 'include',
      });
      if (response.ok) {
        setManualTwitterModalOpen(false);
        setTwitterToken('');
        fetchAccounts();
      } else {
        const data = await response.json();
        alert(data.message || 'Failed to connect manually');
      }
    } catch (e) {
      alert('Error connecting manually');
    }
  };

  const handleManualGoogleConnect = async () => {
    if (!googleToken || !googleAccountId || !googleLocationId) return alert('Token, Account ID, and Location ID are required');

    // Concatenate safely handling cases where user pasted the full prefix or just the ID number
    const accId = googleAccountId.replace('accounts/', '');
    const locId = googleLocationId.replace('locations/', '');
    const fullLocationId = `accounts/${accId}/locations/${locId}`;

    const token = localStorage.getItem('token');
    try {
      const response = await fetch(`https://schedulebubble-zjof.onrender.com/api/oauth/google-manual`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        },
        body: JSON.stringify({ accessToken: googleToken, locationId: fullLocationId }),
        credentials: 'include',
      });
      if (response.ok) {
        setManualGoogleModalOpen(false);
        setGoogleToken('');
        setGoogleAccountId('');
        setGoogleLocationId('');
        fetchAccounts();
      } else {
        const data = await response.json();
        alert(data.message || 'Failed to connect manually');
      }
    } catch (e) {
      alert('Error connecting manually');
    }
  };

  const handleConnect = async (platformId: string) => {
    const token = localStorage.getItem('token');

    if (platformId === 'telegram') {
      const botToken = prompt('Enter your Telegram Bot Token (leave blank to use backend .env):') || '';
      const chatId = prompt('Enter your Telegram Chat ID (leave blank to use backend .env):') || '';

      try {
        const response = await fetch(`https://schedulebubble-zjof.onrender.com/api/oauth/telegram`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...(token ? { 'Authorization': `Bearer ${token}` } : {})
          },
          body: JSON.stringify({ botToken, chatId }),
          credentials: 'include',
        });
        if (response.ok) {
          fetchAccounts();
        } else {
          alert('Failed to connect Telegram');
        }
      } catch (e) {
        alert('Error connecting Telegram');
      }
      return;
    }

    // Redirect to real OAuth flow for X and Meta
    if (platformId === 'twitter') {
      if (!token) return alert('Please log in first');
      window.location.href = `https://schedulebubble-zjof.onrender.com/api/oauth/x?token=${token}`;
      return;
    }
    if (platformId === 'facebook' || platformId === 'instagram') {
      if (!token) return alert('Please log in first');
      window.location.href = `https://schedulebubble-zjof.onrender.com/api/oauth/meta?token=${token}`;
      return;
    }

    try {
      const response = await fetch(`https://schedulebubble-zjof.onrender.com/api/oauth/connect/${platformId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        },
        credentials: 'include',
      });

      if (response.ok) {
        fetchAccounts(); // Refresh the list to show Connected state
      } else {
        const data = await response.json();
        alert(data.message || 'Failed to connect account.');
      }
    } catch (error) {
      console.error('Error connecting account:', error);
      alert('An error occurred while connecting the account.');
    }
  };

  const handleDisconnect = async (accountId: string) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`https://schedulebubble-zjof.onrender.com/api/oauth/disconnect/${accountId}`, {
        method: 'DELETE',
        headers: token ? { 'Authorization': `Bearer ${token}` } : {},
        credentials: 'include',
      });

      if (response.ok) {
        fetchAccounts();
      } else {
        alert('Failed to disconnect account.');
      }
    } catch (error) {
      console.error('Error disconnecting account:', error);
      alert('An error occurred while disconnecting the account.');
    }
  };

  if (loading) return <div className="p-8 text-center text-slate-400">Loading integrations...</div>;

  return (
    <div className="w-full max-w-4xl mx-auto p-5 sm:p-8 rounded-3xl border border-slate-200 dark:border-slate-800/80 backdrop-blur-2xl shadow-2xl hover:border-indigo-500/20 transition-all duration-300 bg-white/70 dark:bg-[rgba(13,18,32,0.7)]">
      <div className="mb-10 text-center sm:text-left">
        <h2 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-slate-900 to-slate-500 dark:from-white dark:to-slate-400 mb-3 tracking-tight">Social Integrations</h2>
        <p className="text-slate-500 dark:text-slate-400 text-sm max-w-2xl">Connect your social media profiles to seamlessly manage, schedule, and analyze your content across all platforms from a single dashboard.</p>
      </div>

      <div className="space-y-4">
        {platforms.map((platform) => {
          let platformAccounts = connectedAccounts.filter(acc => acc.platform === platform.id);

          // Map backend platform strings ('meta', 'x') to frontend platform IDs
          if (platformAccounts.length === 0) {
            if (platform.id === 'facebook') {
              platformAccounts = connectedAccounts.filter(acc => acc.platform === 'meta' && acc.profileName.includes('Facebook'));
            } else if (platform.id === 'instagram') {
              platformAccounts = connectedAccounts.filter(acc => acc.platform === 'meta' && acc.profileName.includes('Instagram'));
            } else if (platform.id === 'twitter') {
              platformAccounts = connectedAccounts.filter(acc => acc.platform === 'x');
            }
          }

          // If the platform is generic meta (no specific Facebook/Instagram tag), show all meta under both for safety, but with names
          if (platformAccounts.length === 0 && (platform.id === 'facebook' || platform.id === 'instagram')) {
            platformAccounts = connectedAccounts.filter(acc => acc.platform === 'meta');
          }

          const isConnected = platformAccounts.length > 0;
          const Icon = platform.icon;

          return (
            <div
              key={platform.id}
              className="group flex flex-col p-5 rounded-2xl border border-slate-200 dark:border-slate-800/60 hover:border-slate-300 dark:hover:border-slate-700/80 transition-all duration-200 cursor-default bg-white/60 dark:bg-[rgba(15,20,35,0.5)]"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center space-x-5">
                  <div className={`p-4 rounded-xl bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 shadow-inner transition-colors duration-300 text-slate-500 dark:text-slate-400 ${platform.color}`}>
                    <Icon className="w-7 h-7" />
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold text-slate-900 dark:text-white tracking-tight">{platform.name}</h3>
                    <div className="flex items-center mt-1.5">
                      <span className="relative flex h-2.5 w-2.5 mr-2.5">
                        {isConnected && <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>}
                        <span className={`relative inline-flex rounded-full h-2.5 w-2.5 ${isConnected ? 'bg-emerald-500' : 'bg-slate-400 dark:bg-slate-500'}`}></span>
                      </span>
                      <span className={`text-sm font-medium ${isConnected ? 'text-emerald-500 dark:text-emerald-400' : 'text-slate-400 dark:text-slate-400'}`}>
                        {isConnected ? `${platformAccounts.length} Connected Account${platformAccounts.length > 1 ? 's' : ''}` : 'Not Connected'}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="w-full sm:w-auto flex flex-col sm:flex-row gap-2">
                  <button
                    onClick={() => handleConnect(platform.id)}
                    className={`w-full sm:w-auto px-5 py-2.5 text-sm font-semibold rounded-xl transition-all duration-300 flex items-center justify-center gap-2 ${isConnected
                        ? 'bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700'
                        : 'text-white bg-indigo-600 hover:bg-indigo-500 active:bg-indigo-700 shadow-[0_0_15px_rgba(79,70,229,0.2)] hover:shadow-[0_0_25px_rgba(79,70,229,0.4)] hover:-translate-y-0.5'
                      }`}
                  >
                    <Plus className="w-4 h-4" />
                    {isConnected ? 'Add Another' : 'Connect Account'}
                  </button>

                  {!isConnected && (platform.id === 'facebook' || platform.id === 'instagram') && (
                    <button
                      onClick={() => setManualMetaModalOpen(true)}
                      className="w-full sm:w-auto px-5 py-2.5 text-sm font-semibold text-indigo-400 hover:text-indigo-300 bg-indigo-500/10 hover:bg-indigo-500/20 active:bg-indigo-500/30 rounded-xl transition-all duration-300"
                    >
                      Connect Manually (Token)
                    </button>
                  )}
                  {!isConnected && platform.id === 'twitter' && (
                    <button
                      onClick={() => setManualTwitterModalOpen(true)}
                      className="w-full sm:w-auto px-5 py-2.5 text-sm font-semibold text-indigo-400 hover:text-indigo-300 bg-indigo-500/10 hover:bg-indigo-500/20 active:bg-indigo-500/30 rounded-xl transition-all duration-300"
                    >
                      Connect Manually (Token)
                    </button>
                  )}
                  {!isConnected && platform.id === 'google' && (
                    <button
                      onClick={() => setManualGoogleModalOpen(true)}
                      className="w-full sm:w-auto px-5 py-2.5 text-sm font-semibold text-indigo-400 hover:text-indigo-300 bg-indigo-500/10 hover:bg-indigo-500/20 active:bg-indigo-500/30 rounded-xl transition-all duration-300"
                    >
                      Connect Manually (Token)
                    </button>
                  )}
                </div>
              </div>

              {/* List of Connected Accounts */}
              {isConnected && (
                <div className="mt-5 space-y-2 border-t border-slate-200 dark:border-slate-700/50 pt-4">
                  {platformAccounts.map((account) => (
                    <div key={account._id} className="flex items-center justify-between bg-slate-50 dark:bg-slate-800/30 p-3 rounded-xl border border-slate-100 dark:border-slate-700/30">
                      <div className="flex items-center space-x-3">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white ${platform.color.replace('text-', 'bg-').split(' ')[0]}`}>
                          <Icon className="w-4 h-4" />
                        </div>
                        <span className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                          {account.profileName}
                        </span>
                      </div>
                      <button
                        onClick={() => handleDisconnect(account._id)}
                        className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-lg transition-colors flex items-center gap-1 text-xs font-medium"
                        title="Disconnect"
                      >
                        <Unlink className="w-3.5 h-3.5" />
                        Disconnect
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {manualMetaModalOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-700 rounded-3xl p-6 w-full max-w-md shadow-2xl">
            <h3 className="text-xl font-bold text-white mb-4">Connect Meta Manually</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-400 mb-2">Long-Lived Access Token</label>
                <input
                  type="text"
                  value={metaToken}
                  onChange={e => setMetaToken(e.target.value)}
                  className="w-full bg-slate-800 text-white border border-slate-700 rounded-xl px-4 py-2 text-sm focus:outline-none focus:border-indigo-500 transition-colors"
                  placeholder="EAAI..."
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-400 mb-2">Instagram User ID or Facebook Page ID</label>
                <input
                  type="text"
                  value={metaProfileId}
                  onChange={e => setMetaProfileId(e.target.value)}
                  className="w-full bg-slate-800 text-white border border-slate-700 rounded-xl px-4 py-2 text-sm focus:outline-none focus:border-indigo-500 transition-colors"
                  placeholder="178414..."
                />
              </div>
              <div className="flex gap-3 mt-6">
                <button
                  onClick={() => setManualMetaModalOpen(false)}
                  className="flex-1 py-2 bg-slate-800 text-white font-semibold rounded-xl hover:bg-slate-700 transition"
                >
                  Cancel
                </button>
                <button
                  onClick={handleManualMetaConnect}
                  className="flex-1 py-2 bg-indigo-600 text-white font-semibold rounded-xl hover:bg-indigo-500 transition shadow-[0_0_15px_rgba(79,70,229,0.3)]"
                >
                  Connect
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {manualTwitterModalOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-700 rounded-3xl p-6 w-full max-w-md shadow-2xl">
            <h3 className="text-xl font-bold text-white mb-4">Connect Twitter (X) Manually</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-400 mb-2">Bearer Token or User Access Token</label>
                <input
                  type="text"
                  value={twitterToken}
                  onChange={e => setTwitterToken(e.target.value)}
                  className="w-full bg-slate-800 text-white border border-slate-700 rounded-xl px-4 py-2 text-sm focus:outline-none focus:border-indigo-500 transition-colors"
                  placeholder="AAAAAAAAAAAAAAAAAAAAA..."
                />
              </div>
              <div className="flex gap-3 mt-6">
                <button
                  onClick={() => setManualTwitterModalOpen(false)}
                  className="flex-1 py-2 bg-slate-800 text-white font-semibold rounded-xl hover:bg-slate-700 transition"
                >
                  Cancel
                </button>
                <button
                  onClick={handleManualTwitterConnect}
                  className="flex-1 py-2 bg-indigo-600 text-white font-semibold rounded-xl hover:bg-indigo-500 transition shadow-[0_0_15px_rgba(79,70,229,0.3)]"
                >
                  Connect
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {manualGoogleModalOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-700 rounded-3xl p-6 w-full max-w-md shadow-2xl">
            <h3 className="text-xl font-bold text-white mb-4">Connect Google Business Manually</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-400 mb-2">Access Token</label>
                <input
                  type="text"
                  value={googleToken}
                  onChange={e => setGoogleToken(e.target.value)}
                  className="w-full bg-slate-800 text-white border border-slate-700 rounded-xl px-4 py-2 text-sm focus:outline-none focus:border-indigo-500 transition-colors"
                  placeholder="ya29.a0A..."
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-400 mb-2">Account ID (format: accounts/12345)</label>
                <input
                  type="text"
                  value={googleAccountId}
                  onChange={e => setGoogleAccountId(e.target.value)}
                  className="w-full bg-slate-800 text-white border border-slate-700 rounded-xl px-4 py-2 text-sm focus:outline-none focus:border-indigo-500 transition-colors"
                  placeholder="accounts/123456789"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-400 mb-2">Location ID (format: locations/98765)</label>
                <input
                  type="text"
                  value={googleLocationId}
                  onChange={e => setGoogleLocationId(e.target.value)}
                  className="w-full bg-slate-800 text-white border border-slate-700 rounded-xl px-4 py-2 text-sm focus:outline-none focus:border-indigo-500 transition-colors"
                  placeholder="locations/987654321"
                />
              </div>
              <div className="flex gap-3 mt-6">
                <button
                  onClick={() => setManualGoogleModalOpen(false)}
                  className="flex-1 py-2 bg-slate-800 text-white font-semibold rounded-xl hover:bg-slate-700 transition"
                >
                  Cancel
                </button>
                <button
                  onClick={handleManualGoogleConnect}
                  className="flex-1 py-2 bg-indigo-600 text-white font-semibold rounded-xl hover:bg-indigo-500 transition shadow-[0_0_15px_rgba(79,70,229,0.3)]"
                >
                  Save / Connect
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default IntegrationsPanel;
