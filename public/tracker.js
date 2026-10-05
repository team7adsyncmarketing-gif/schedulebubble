// ScheduleBubble Lead Tracker
(function() {
  const SCRIPT_VERSION = '1.0';
  const SCHEDULEBUBBLE_API_URL = 'https://schedulebubble.onrender.com'; // Change to your live backend URL

  // 1. Capture fbclid from URL
  const urlParams = new URLSearchParams(window.location.search);
  const fbclid = urlParams.get('fbclid');

  if (fbclid) {
    // Save to localStorage for 30 days
    const expiry = new Date().getTime() + (30 * 24 * 60 * 60 * 1000);
    localStorage.setItem('_sb_fbclid', JSON.stringify({ value: fbclid, expiry: expiry }));
    console.log('[ScheduleBubble Tracker] Captured fbclid:', fbclid);
  }

  // Helper to get active fbclid
  function getFbclid() {
    const itemStr = localStorage.getItem('_sb_fbclid');
    if (!itemStr) return null;
    const item = JSON.parse(itemStr);
    if (new Date().getTime() > item.expiry) {
      localStorage.removeItem('_sb_fbclid');
      return null;
    }
    return item.value;
  }

  // 2. Expose a global function for clients to easily push leads to your API
  window.ScheduleBubble = {
    captureLead: async function(leadData) {
      // leadData should be { name, email, phone, user_id (the client's ID) }
      const activeFbclid = getFbclid();
      
      const payload = {
        ...leadData,
        fbclid: activeFbclid,
        source: 'Website Form'
      };

      try {
        const response = await fetch(SCHEDULEBUBBLE_API_URL + '/api/leads', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
        const data = await response.json();
        console.log('[ScheduleBubble Tracker] Lead captured successfully:', data);
        return data;
      } catch (err) {
        console.error('[ScheduleBubble Tracker] Failed to capture lead:', err);
      }
    }
  };
})();
