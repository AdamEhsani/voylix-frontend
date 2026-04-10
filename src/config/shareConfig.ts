/**
 * Configuration for the Share Service.
 * You can easily change the webhook URL and other settings here for n8n integration.
 */
export const SHARE_CONFIG = {
  // Replace this with your actual n8n webhook URL
  WEBHOOK_URL: 'https://your-n8n-webhook-url.com/share-invoice',
  
  // Optional: Add any required headers (e.g., API Key, Bearer Token)
  HEADERS: {
    'Content-Type': 'application/json',
    // 'Authorization': 'Bearer YOUR_TOKEN_HERE',
  }
};
