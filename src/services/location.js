import api from '~/utils/axios';
import { apiUrls } from '~/utils/api';

/**
 * Log a single GPS point to the backend.
 * @param {{ lat, lng, accuracy?, altitude?, speed?, heading?, sessionId?, timestamp? }} point
 */
export async function logLocationPoint(point) {
  try {
    const res = await api.post(apiUrls.crmLocation, point);
    return res.data;
  } catch (error) {
    // Silently fail — location logging should never crash the app
    console.warn('[LOCATION_LOG] Failed to post point:', error?.message);
    return null;
  }
}

/**
 * Fetch the location trail for a user.
 * @param {{ userId?, date?, startDate?, endDate?, sessionId?, limit? }} params
 */
export async function getLocationTrail(params = {}) {
  try {
    const res = await api.get(apiUrls.crmLocation, { params });
    return res.data?.data || { points: [], totalPoints: 0, totalDistanceMeters: 0 };
  } catch (error) {
    console.warn('[LOCATION_TRAIL] Failed to fetch trail:', error?.message);
    return { points: [], totalPoints: 0, totalDistanceMeters: 0 };
  }
}

/**
 * Fetch organization team members with their latest GPS location and trails.
 * Defaults to filtering for mobile logged-in users on mobile devices.
 * @param {Object} params
 */
export async function getTeamLocations(params = {}) {
  try {
    const res = await api.get(apiUrls.crmLocation, {
      params: { team: 'true', platform: 'mobile', ...params },
    });
    return res.data?.data || { users: [], totalUsers: 0 };
  } catch (error) {
    console.warn('[LOCATION_TEAM] Failed to fetch team locations:', error?.message);
    return { users: [], totalUsers: 0 };
  }
}

/**
 * Clear location trail (today's points or a specific session).
 * @param {{ sessionId? }} params
 */
export async function clearLocationTrail(params = {}) {
  try {
    const res = await api.delete(apiUrls.crmLocation, { params });
    return res.data;
  } catch (error) {
    console.warn('[LOCATION_TRAIL] Failed to clear trail:', error?.message);
    return null;
  }
}
