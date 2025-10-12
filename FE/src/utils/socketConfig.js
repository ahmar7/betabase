/**
 * Get the backend URL for Socket.io connections
 * Extracts the base URL from REACT_APP_API_URL
 * 
 * Example:
 * - https://api.bitblaze.space/api/v1 → https://api.bitblaze.space
 * - http://localhost:5000/api → http://localhost:5000
 * 
 * @returns {string} Backend URL for Socket.io
 */
export const getSocketBackendUrl = () => {
  const apiUrl = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';
  
  try {
    const url = new URL(apiUrl);
    const backendUrl = `${url.protocol}//${url.host}`;
    
    console.log('📡 Socket.io Backend URL:', backendUrl);
    return backendUrl;
  } catch (e) {
    console.error('❌ Invalid REACT_APP_API_URL:', apiUrl, e);
    return 'http://localhost:5000'; // Fallback for local dev
  }
};

/**
 * Default Socket.io connection options
 */
export const socketOptions = {
  withCredentials: true,
  transports: ['websocket', 'polling'],
  reconnection: true,
  reconnectionDelay: 1000,
  reconnectionDelayMax: 5000,
  reconnectionAttempts: 5
};

