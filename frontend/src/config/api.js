/**
 * API base URL:
 * - Local dev: http://localhost:5000 (or REACT_APP_API_URL)
 * - Single Vercel deploy (same domain): leave REACT_APP_API_URL unset → relative /api/...
 * - Split deploy (separate API project): REACT_APP_API_URL=https://your-api.vercel.app
 */
const configured = process.env.REACT_APP_API_URL;
const base =
    configured !== undefined && configured !== ''
        ? configured
        : process.env.NODE_ENV === 'production'
          ? ''
          : 'http://localhost:5000';

export const API_URL = base.replace(/\/$/, '');

/** Build a full API or static asset URL from a path like /api/v1/auth/me or /uploads/photo.jpg */
export function apiUrl(path = '') {
    if (!path) return API_URL;
    if (path.startsWith('http://') || path.startsWith('https://')) return path;
    return `${API_URL}${path.startsWith('/') ? path : `/${path}`}`;
}
