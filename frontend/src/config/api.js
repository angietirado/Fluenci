/** Backend base URL — set REACT_APP_API_URL in Vercel (no trailing slash). */
export const API_URL = (process.env.REACT_APP_API_URL || 'http://localhost:5000').replace(
    /\/$/,
    ''
);

/** Build a full API or static asset URL from a path like /api/v1/auth/me or /uploads/photo.jpg */
export function apiUrl(path = '') {
    if (!path) return API_URL;
    if (path.startsWith('http://') || path.startsWith('https://')) return path;
    return `${API_URL}${path.startsWith('/') ? path : `/${path}`}`;
}
