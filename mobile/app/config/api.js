// API Configuration
// Change USE_NGROK to false to use local network IP instead
const USE_NGROK = false; // Set to true if ngrok is running
const NGROK_URL = 'https://mallard-set-akita.ngrok-free.app';
const LOCAL_IP = '192.168.50.202'; // Change this to your computer's local IP (find it with: ipconfig or ifconfig)
const LOCAL_PORT = '3001';

export const API_BASE_URL = USE_NGROK 
  ? NGROK_URL 
  : `http://${LOCAL_IP}:${LOCAL_PORT}`;

export const API_HEADERS = {
  'Content-Type': 'application/json',
  'Accept': 'application/json',
  ...(USE_NGROK && { 'ngrok-skip-browser-warning': 'true' }),
};

// Helper function for fetch requests
export const apiFetch = async (endpoint, options = {}) => {
  const url = `${API_BASE_URL}${endpoint}`;
  const response = await fetch(url, {
    ...options,
    headers: {
      ...API_HEADERS,
      ...options.headers,
    },
    credentials: 'include',
  });

  // Check if response is JSON
  const contentType = response.headers.get('content-type');
  if (!contentType || !contentType.includes('application/json')) {
    const text = await response.text();
    if (text.includes('offline') || text.includes('ERR_NGROK')) {
      throw new Error('Ngrok tunnel is offline. Please start ngrok or use local IP.');
    }
    throw new Error(`Server returned non-JSON response: ${text.substring(0, 100)}`);
  }

  return response;
};

// Default export to satisfy expo-router
export default { API_BASE_URL, API_HEADERS, apiFetch };

