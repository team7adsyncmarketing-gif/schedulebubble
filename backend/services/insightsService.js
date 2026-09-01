import axios from 'axios';

export const startInsightsService = () => {
  console.log('📊 Starting Background Insights Service (Runs every 6 hours)...');
  
  const SIX_HOURS = 6 * 60 * 60 * 1000;
  
  const runSync = async () => {
    // INSIGHTS SERVICE DISABLED BY USER REQUEST
    // To prevent API spam and deprecation errors from Facebook/Instagram Graph API.
    // Dashboard will now rely purely on local database metrics.
    return;
  };

  // Run immediately on startup
  runSync();
  
  // Then run every 6 hours
  setInterval(runSync, SIX_HOURS);
};
