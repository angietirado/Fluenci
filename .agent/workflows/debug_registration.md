# Debug Registration Failure Workflow

---
description: Steps to diagnose and fix "Registration failed: Failed to fetch" error in the influencer registration flow.
---

1. **Ensure Backend is Running**
   - Verify the backend server is up:
     ```
     npm run dev   # from the backend directory
     ```
   - Look for the console line `Server running in development mode on port 5000`.

2. **Restart Frontend Development Server**
   - After adding the `proxy` field to `frontend/package.json`, restart the React dev server so the proxy takes effect:
     ```
     npm start   # from the frontend directory
     ```

3. **Check Proxy Configuration**
   - Open `frontend/package.json` and confirm the entry:
     ```json
     "proxy": "http://localhost:5000"
     ```
   - This makes calls to `/api/...` automatically forward to the backend.

4. **Inspect Network Request**
   - Open the app in the browser, go to the influencer registration page, fill the form and click **Register**.
   - Open DevTools → Network tab.
   - Locate the request to `/api/v1/auth/register`.
   - Verify:
     - **Request URL** is `http://localhost:3000/api/v1/auth/register` (proxy will forward).
     - **Status Code** is `200` (or `201`).
     - **Response** is valid JSON containing `{ "success": true, "token": "..." }`.
   - If you see a **CORS** error or a **404/500** status, note the details.

5. **Validate Backend Logs**
   - In the backend terminal, look for any error stack traces when the request is made.
   - If nothing appears, add a temporary `console.log('Register endpoint hit', req.body);` at the start of `exports.register` in `backend/controllers/authController.js` and restart the backend.

6. **Common Pitfalls & Fixes**
   - **Missing JWT import**: Ensure `const jwt = require('jsonwebtoken');` is present at the top of `backend/models/User.js` (already added).
   - **CORS Misconfiguration**: In `backend/server.js` the CORS origin should match the frontend URL. It is set to `http://localhost:3000` – keep it.
   - **Duplicate Email**: If you try the same email twice, the API returns a 400 with `That email is already registered.` Change the email address for each test.
   - **Incorrect fetch URL**: The frontend now uses a relative URL (`/api/v1/auth/register`). Ensure the change is saved and the dev server restarted.

7. **Verify Successful Registration**
   - After a successful request, the UI should navigate to the appropriate dashboard (`/influencer-dashboard` or `/business-dashboard`).
   - Check `localStorage`/`sessionStorage` for the stored JWT if your app saves it.

8. **If the Issue Persists**
   - Share the exact error message from the Network tab and any backend console output.
   - Provide the request payload (redacted email) and response payload.
   - We can then dive deeper into the specific failure.

---
*End of workflow.*
