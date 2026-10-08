content = """// ScheduleBubble Lead Tracking Engine (Updated for Google & Meta)
(function() {
    window.ScheduleBubble = window.ScheduleBubble || {};

    // 1. Instantly hunt for Meta and Google Click IDs in the URL
    const urlParams = new URLSearchParams(window.location.search);
    const fbclid = urlParams.get('fbclid');
    const gclid = urlParams.get('gclid');

    // 2. Save them to the browser (so if they browse other pages before filling the form, we don't lose them)
    if (fbclid) {
        localStorage.setItem('sb_fbclid', fbclid);
    }
    if (gclid) {
        localStorage.setItem('sb_gclid', gclid);
    }

    // 3. The trigger function that websites call to capture the lead
    window.ScheduleBubble.captureLead = function(leadData) {
        const storedFbclid = localStorage.getItem('sb_fbclid');
        const storedGclid = localStorage.getItem('sb_gclid');

        const payload = {
            user_id: leadData.user_id,
            name: leadData.name,
            email: leadData.email,
            phone: leadData.phone,
            source: leadData.source || 'Website Form',
            fbclid: storedFbclid || null,
            gclid: storedGclid || null
        };

        // Beam the data to the Render Backend
        fetch('https://schedulebubble.onrender.com/api/leads', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(payload)
        })
        .then(response => response.json())
        .then(data => console.log('ScheduleBubble: Lead captured securely.'))
        .catch((error) => console.error('ScheduleBubble Error:', error));
    };
})();
"""

with open('public/tracker.js', 'w', encoding='utf-8') as f:
    f.write(content)
print("Updated tracker.js")
