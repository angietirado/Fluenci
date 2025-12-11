# OAuth Troubleshooting Guide

## "Invalid App ID" Error

### Quick Fixes (Try These First):

1. **Restart Backend Server**
   ```bash
   # Stop server (Ctrl+C)
   # Then restart:
   cd backend
   npm start
   ```

2. **Check Facebook App Mode**
   - Go to [Facebook Developers](https://developers.facebook.com/)
   - Select your app → Settings → Basic
   - Check "App Mode" (should be "Development" or "Live")
   - If Development mode: Add yourself as a tester
     - Go to Roles → Roles → Add People
     - Enter your Facebook email/name → Select "Tester"

3. **Verify Environment Variables Are Loaded**
   - Check `backend/config/config.env` has:
     ```
     FACEBOOK_CLIENT_ID=1150247030456513
     FACEBOOK_CLIENT_SECRET=6ab9e52555ff619cfd0fde466f9846e9
     INSTAGRAM_CLIENT_ID=1150247030456513
     INSTAGRAM_CLIENT_SECRET=6ab9e52555ff619cfd0fde466f9846e9
     ```
   - Restart backend server after making changes

4. **Check Redirect URIs in Facebook Console**
   - Settings → Basic → Valid OAuth Redirect URIs
   - Must include:
     - `http://localhost:5000/api/v1/social/callback/facebook`
     - `http://localhost:5000/api/v1/social/callback/instagram`

5. **Verify App ID in Browser**
   - Open browser DevTools (F12) → Network tab
   - Click "Connect with Facebook"
   - Check the OAuth URL - should contain: `client_id=1150247030456513`
   - If you see `client_id=undefined` or wrong ID → Backend env vars not loaded

### Common Issues:

**Issue:** App ID shows as `undefined` in OAuth URL
- **Solution:** Backend server needs restart to load `.env` file

**Issue:** "App Not Available" error
- **Solution:** App is in Development mode - add yourself as tester

**Issue:** Works for you but not others
- **Solution:** App needs to be switched to "Live" mode (requires app review)

**Issue:** Redirect URI mismatch
- **Solution:** Ensure exact match in Facebook Console (including http:// and port)

### Testing Steps:

1. Restart backend: `cd backend && npm start`
2. Restart frontend: `cd frontend && npm start`
3. Open browser console (F12)
4. Try connecting Facebook/Instagram
5. Check Network tab for OAuth URL
6. Verify App ID in URL matches: `1150247030456513`

---

## "Broken URL detected" Error

### What This Means:

Facebook detected that the **"Website: Site URL"** field in Basic Settings contains `http://localhost:3000/`, which is not publicly accessible. Facebook's crawlers cannot access localhost URLs.

### Important Distinction:

- **Website URL** (Basic Settings) = Must be publicly accessible
- **OAuth Redirect URIs** = Can be localhost URLs (these work fine!)

### How to Fix:

**⚠️ If Site URL Field Shows Red Warning Icon (Required Field):**

Facebook sometimes requires a Site URL. Since you can't use `localhost`, use a placeholder:

**Option 1: Use a Placeholder URL (Recommended)**
1. Go to **Settings → Basic**
2. Find **"Website"** section (with the red warning icon)
3. In the **"Site URL"** field, enter a placeholder:
   - `https://example.com` (simple placeholder)
   - `https://fluenci.com` (if you have a domain)
   - `https://your-app-name.herokuapp.com` (if deployed)
4. Click **"Save Changes"** at the bottom
5. The red warning should disappear

**Option 2: Try Leaving Empty (May Not Work)**
- Some Facebook apps allow empty Site URL
- If you see a red warning icon, Facebook requires a value
- In this case, use Option 1 above

**Option 3: Use ngrok for Testing (If You Need Real URL)**
- If you need a publicly accessible URL for testing:
  1. Install ngrok: `npm install -g ngrok` or download from ngrok.com
  2. Run: `ngrok http 3000` (or your frontend port)
  3. Copy the HTTPS URL (e.g., `https://abc123.ngrok.io`)
  4. Use this URL in the Site URL field
  5. Note: ngrok URLs change each time you restart (free tier)

**Option 3: Use ngrok for Testing (Advanced)**
- If you need a public URL for testing:
  1. Install ngrok: `npm install -g ngrok`
  2. Run: `ngrok http 3000`
  3. Use the ngrok URL (e.g., `https://abc123.ngrok.io`) in Website field

### Why This Happens:

- Facebook requires all URLs in Basic Settings to be publicly accessible
- This is for app review and verification purposes
- OAuth redirect URIs (`localhost:5000`) are fine - they're different!

### Important Notes:

- **The Site URL is separate from OAuth Redirect URIs**
  - Site URL = General website URL (must be public)
  - OAuth Redirect URIs = Can be `localhost:5000` (these work fine!)
  
- **Using a placeholder URL (`https://example.com`) is fine for development**
  - Facebook just needs a valid URL format
  - It doesn't need to actually work for OAuth to function
  - OAuth uses the Redirect URIs, not the Site URL

- **This does NOT affect OAuth functionality**
  - Your OAuth redirect URIs (`localhost:5000`) will still work
  - The Site URL is mainly for app review/verification
  - You can use a placeholder until you have a real domain

- **Before going Live:**
  - Replace placeholder with your actual production domain
  - Ensure the URL is publicly accessible
