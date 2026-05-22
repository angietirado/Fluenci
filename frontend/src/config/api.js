/**
 * Resolves API base URL at runtime (works after deploy without rebuilding env vars).
 *
 * - localhost → http://localhost:5000 (or REACT_APP_API_URL)
 * - Production, same host as REACT_APP_API_URL → relative "" (/api/v1/...)
 * - Production, different API host → REACT_APP_API_URL (split Vercel projects)
 */
function resolveApiUrl() {
    const envUrl = (process.env.REACT_APP_API_URL || '').replace(/\/$/, '');

    if (typeof window !== 'undefined' && window.location?.hostname) {
        const { origin, hostname } = window.location;

        if (hostname === 'localhost' || hostname === '127.0.0.1') {
            return envUrl || 'http://localhost:5000';
        }

        // One Vercel project: UI and API share this origin → use /api/... paths
        if (!envUrl || envUrl === origin) {
            return '';
        }

        return envUrl;
    }

    if (envUrl) return envUrl;
    return process.env.NODE_ENV === 'production' ? '' : 'http://localhost:5000';
}

export const API_URL = resolveApiUrl();

/** Base path for versioned REST API, e.g. /api/v1 or https://host/api/v1 */
export const API_V1 = `${API_URL}/api/v1`;

/** Dashboard path for the logged-in user */
export function getDashboardPath(user) {
    if (!user?.role) return '/';
    if (user.role === 'business') return '/business-dashboard';
    if (user.role === 'influencer') return '/influencer-dashboard';
    if (user.role === 'admin') return '/admin/users';
    return '/';
}

/** Build a full API or static asset URL from a path like /api/v1/auth/me or /uploads/photo.jpg */
export function apiUrl(path = '') {
    if (!path) return API_URL;
    if (path.startsWith('http://') || path.startsWith('https://')) return path;
    return `${API_URL}${path.startsWith('/') ? path : `/${path}`}`;
}
