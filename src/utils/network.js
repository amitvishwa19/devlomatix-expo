export function isOfflineError(error) {
  if (!error) return false;
  if (error.isOffline) return true;
  if (error.code === 'ERR_NETWORK' || error.code === 'ECONNABORTED') return true;
  if (!error.response && error.request) return true;
  const message = String(error.message || '').toLowerCase();
  return message.includes('network error') || message.includes('network request failed');
}
