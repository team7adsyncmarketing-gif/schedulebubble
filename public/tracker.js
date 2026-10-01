/**
 * ScheduleBubble Lead Quality Tracker (Module 1)
 * 
 * This script captures the fbclid (Meta) or gclid (Google) from the URL 
 * when a user clicks an ad and lands on the page. It stores it in localStorage
 * so that when the user submits a lead form, we can attach this ID to the lead.
 */

(function() {
    // Function to parse URL parameters
    function getQueryParam(param) {
        const urlParams = new URLSearchParams(window.location.search);
        return urlParams.get(param);
    }

    // Capture the click IDs
    const fbclid = getQueryParam('fbclid');
    const gclid = getQueryParam('gclid');

    // If an ID exists, save it in localStorage (expires after a set time or kept indefinitely)
    if (fbclid) {
        console.log('[ScheduleBubble Tracker] Captured fbclid:', fbclid);
        localStorage.setItem('sb_fbclid', fbclid);
    }
    
    if (gclid) {
        console.log('[ScheduleBubble Tracker] Captured gclid:', gclid);
        localStorage.setItem('sb_gclid', gclid);
    }

    // Helper function exposed globally to retrieve the IDs when submitting a form
    window.SB_Tracker = {
        getTrackingData: function() {
            return {
                fbclid: localStorage.getItem('sb_fbclid'),
                gclid: localStorage.getItem('sb_gclid'),
                source: localStorage.getItem('sb_fbclid') ? 'meta' : (localStorage.getItem('sb_gclid') ? 'google' : 'organic')
            };
        },
        clearTrackingData: function() {
            localStorage.removeItem('sb_fbclid');
            localStorage.removeItem('sb_gclid');
        }
    };
})();
