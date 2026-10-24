/**
 * Haversine distance between two GPS coordinates.
 * @param {{ lat: number, lng: number }} a
 * @param {{ lat: number, lng: number }} b
 * @returns {number} distance in metres
 */
export function haversineMeters(a, b) {
  const R = 6371000;
  const toRad = (deg) => (deg * Math.PI) / 180;
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const sinA = Math.sin(dLat / 2);
  const sinB = Math.sin(dLng / 2);
  const c =
    sinA * sinA +
    Math.cos(toRad(a.lat)) * Math.cos(toRad(b.lat)) * sinB * sinB;
  return R * 2 * Math.atan2(Math.sqrt(c), Math.sqrt(1 - c));
}

/**
 * Format metres into a human-readable distance string.
 * @param {number} metres
 * @returns {string}  e.g. "450 m" or "3.2 km"
 */
export function formatDistance(metres) {
  if (metres < 1000) return `${Math.round(metres)} m`;
  return `${(metres / 1000).toFixed(1)} km`;
}

/**
 * Generate a session ID based on the current date (one session per day).
 * Override this if you want finer-grained sessions.
 * @returns {string} e.g. "2025-11-05"
 */
export function dailySessionId() {
  return new Date().toISOString().slice(0, 10);
}
