# OAuth Setup Guide

This guide will help you set up OAuth connections for social media platforms to automatically fetch follower counts.

## Overview

OAuth allows users to connect their social media accounts securely without sharing passwords. When connected, the app can automatically fetch follower counts from their APIs.

## Step-by-Step Setup

### 1. Instagram OAuth Setup (For Follower Counts)

**Requirements:**
- Facebook Developer Account
- Instagram Business or Creator Account (NOT personal account)
- Facebook Page linked to the Instagram account

**Steps:**

#### Step 1: Create the App
1. Go to [Facebook Developers](https://developers.facebook.com/)
2. Click "Create App" or "My Apps" → "Create App"
3. **Select a use case** - You have two options:
   - **Option A (Recommended)**: Click **"Create an app without a use case"** at the bottom
   - **Option B**: Select any use case like **"Business"**, **"Consumer"**, or **"Authenticate and request data from users with Facebook Login"**
   - **The use case doesn't matter** - Instagram Graph API is added as a Product after app creation
4. Fill in App details (name, contact email)
5. Click "Create App"

#### Step 2: Add Instagram Graph API Product
1. After creating the app, you'll be in the app dashboard
2. **Find the Products section** - Look for one of these:
   - A button that says **"Add Products"** or **"Add Product"** (usually at the top or in the left sidebar)
   - A section called **"Products"** in the left sidebar menu
   - If you don't see it, look for **"Dashboard"** in the left sidebar and click it
3. **Browse available products** - You'll see a list of Facebook products like:
   - Facebook Login
   - Instagram Graph API
   - Instagram Basic Display
   - Messenger
   - etc.
4. **Find "Instagram Graph API"** in the products list
   - It might be listed as **"Instagram Graph API"** or just **"Instagram"**
   - Make sure it's **"Instagram Graph API"** (NOT "Instagram Basic Display")
5. **Click the "Set Up" or "Add" button** next to Instagram Graph API
   - This will add the Instagram Graph API product to your app
6. **You may be asked to select a use case** - Choose:
   - ✅ **"To help brands and advertisers understand, manage, and discover their audience: Comment Moderation, Manage Insights and Public Content Access"**
   - ❌ NOT "To help businesses view their own content within third party apps: Basic Permission"
7. Click **"Next"** or **"Continue"** to proceed

**Visual Guide:**
- Left Sidebar → **"Products"** → Look for **"Instagram Graph API"** → Click **"Set Up"**
- OR: Dashboard → **"Add Product"** button → Find **"Instagram Graph API"** → Click **"Set Up"**

**If you can't find it:**
- Make sure you're logged into Facebook Developers
- Try refreshing the page
- The product might be under **"Marketing API"** or **"Business"** category
- You can also search for "Instagram" in the products search bar

#### Step 3: Add Facebook Login Product (Required for OAuth)
**Important:** Before configuring OAuth redirect URIs, you need to add the "Facebook Login" product:

1. Go to **Products** in the left sidebar (or click **"Add Product"**)
2. Find **"Facebook Login"** in the products list
3. Click **"Set Up"** next to Facebook Login
4. You'll be taken to the Facebook Login settings page
5. **Don't worry about configuring it fully yet** - we just need it added so OAuth redirect URIs become available

#### Step 4: Configure OAuth Settings
1. Go to **Settings → Basic** (in the left sidebar)
2. **Note your App ID** (this is your Client ID) - You can see it at the top of this page (e.g., `1150247030456513`)
   - Write this down - you'll need it for your `.env` file
3. **Note your App Secret** (this is your Client Secret):
   - Click **"Show"** next to "App secret" to reveal it
   - Copy it immediately - you can only see it once!
   - Write this down - you'll need it for your `.env` file
4. **Scroll down** on the Basic settings page to find **"Valid OAuth Redirect URIs"** section
   - It should be near the bottom of the page
   - If you don't see it, make sure you added "Facebook Login" product in Step 3
5. **Add your redirect URI:**
   - Click **"Add Platform"** or the **"+"** button next to "Valid OAuth Redirect URIs"
   - In the input field, add:
   ```
   http://localhost:5000/api/v1/social/callback/instagram
   ```
   - Press Enter or click outside the field
6. **For production, also add:**
   - Add another redirect URI:
   ```
   https://yourdomain.com/api/v1/social/callback/instagram
   ```
   - Replace `yourdomain.com` with your actual domain
7. Click **"Save Changes"** at the bottom of the page

**Note:** If "Valid OAuth Redirect URIs" is still not visible:
- Make sure you've added "Facebook Login" product
- Try refreshing the page
- The redirect URI might also be configured in **Products → Instagram Graph API → Basic Display** settings

#### Step 5: Configure Instagram Graph API Settings
1. Go to **Products** in the left sidebar
2. Find **"Instagram Graph API"** in your list of added products
3. Click on **"Instagram Graph API"** to open its settings
4. Look for **"Basic Display"** or **"Business API"** settings
   - You might see tabs like: "Basic Display", "Business API", "Settings"
5. **If you see Business API settings:**
   - Click on **"Business API"** or **"Business API settings"**
   - You may see two use case options. **Select the second one:**
   - ✅ **"To help brands and advertisers understand, manage, and discover their audience: Comment Moderation, Manage Insights and Public Content Access"**
   - ❌ NOT "To help businesses view their own content within third party apps: Basic Permission"
   - This use case provides access to **"Manage Insights"** which includes follower counts
   - Click **"Next"** or **"Save"** to continue
6. **Add redirect URI if prompted:**
   - If you see a field for redirect URI, add: `http://localhost:5000/api/v1/social/callback/instagram`
   - Click **"Save"** or **"Save Changes"**

**Alternative Path:**
- Sometimes the settings are under: **Products → Instagram Graph API → Settings → Basic Display**
- Or: **Products → Instagram Graph API → Quick Start → Basic Display**

#### Step 6: Add Credentials to Config
Add to `backend/config/config.env`:
```
INSTAGRAM_CLIENT_ID=your_app_id_here
INSTAGRAM_CLIENT_SECRET=your_app_secret_here
```

**Required Permissions/Scopes:**
- `instagram_basic`
- `pages_show_list`
- `pages_read_engagement`
- `business_management` (for accessing follower counts)

**Important Notes:**
- **Instagram Graph API** = Provides follower counts (requires Business/Creator account)
- The Instagram account MUST be converted to Business or Creator account
- The Instagram account MUST be linked to a Facebook Page
- **Don't worry about the use case selection** - Instagram Graph API is added as a Product after app creation

---

### 2. YouTube OAuth Setup

**Requirements:**
- Google Cloud Platform Account

**Steps:**
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing
3. Enable "YouTube Data API v3"
4. Go to "Credentials" → "Create Credentials" → "OAuth 2.0 Client ID"
5. Application type: Web application
6. Add authorized redirect URI: `http://localhost:5000/api/v1/social/callback/youtube`
7. Copy the **Client ID** and **Client Secret**
8. Add to `backend/config/config.env`:
   ```
   YOUTUBE_CLIENT_ID=your_client_id_here
   YOUTUBE_CLIENT_SECRET=your_client_secret_here
   ```

---

### 3. Twitter/X OAuth Setup

**Requirements:**
- Twitter Developer Account

**Steps:**
1. Go to [Twitter Developer Portal](https://developer.twitter.com/)
2. Create a new app
3. Go to "Keys and tokens"
4. Copy the **Client ID** and **Client Secret**
5. Add callback URL: `http://localhost:5000/api/v1/social/callback/twitter`
6. Add to `backend/config/config.env`:
   ```
   TWITTER_CLIENT_ID=your_client_id_here
   TWITTER_CLIENT_SECRET=your_client_secret_here
   ```

---

### 4. Facebook OAuth Setup

**Requirements:**
- Facebook Developer Account

**Steps:**
1. Go to [Facebook Developers](https://developers.facebook.com/)
2. Create a new app
3. Add "Facebook Login" product
4. Go to Settings → Basic
5. Note your **App ID** (this is your Client ID) - You can see it on this page (e.g., `1234567890123456`)
6. Note your **App Secret** (click "Show" next to "App secret" to reveal it - this is your Client Secret)
7. **Find your API Version**: 
   - Look at the top of the Settings → Basic page
   - You'll see something like "API Version: v18.0" or check in the Graph API Explorer
   - Common versions: v18.0, v19.0, v20.0
8. **Add your redirect URI**: Scroll down to "Valid OAuth Redirect URIs" section
   - Click "Add Platform" or the "+" button
   - Add: `http://localhost:5000/api/v1/social/callback/facebook`
   - For production, also add: `https://yourdomain.com/api/v1/social/callback/facebook`
   - Click "Save Changes"
9. **Add credentials to backend config** (`backend/config/config.env`):
   ```
   FACEBOOK_CLIENT_ID=your_app_id_here
   FACEBOOK_CLIENT_SECRET=your_app_secret_here
   ```
10. **Add Facebook SDK to frontend**:
    - Open `frontend/public/index.html`
    - Find the Facebook SDK script section
    - Replace `{your-app-id}` with your actual App ID (from step 5)
    - Replace `v18.0` with your API version (from step 7)
    - Example:
      ```javascript
      appId: '1234567890123456',  // Your App ID
      version: 'v18.0'  // Your API version
      ```

11. **Understanding Facebook SDK Functions**:
    
    Facebook provides these SDK functions that are now available via the `useFacebookSDK` hook:
    
    **`FB.getLoginStatus()`** - Check if user is logged in:
    ```javascript
    // This function checks the current login status
    // Response structure:
    {
        status: 'connected',  // or 'not_authorized', 'unknown'
        authResponse: {
            accessToken: '...',
            expiresIn: '...',
            signedRequest: '...',
            userID: '...'
        }
    }
    ```
    
    **Usage in React components:**
    ```javascript
    import useFacebookSDK from '../hooks/useFacebookSDK';
    
    const MyComponent = () => {
        const { fbReady, checkLoginStatus, loginStatus } = useFacebookSDK();
        
        useEffect(() => {
            if (fbReady) {
                // Check login status when component mounts
                checkLoginStatus((response) => {
                    if (response.status === 'connected') {
                        console.log('User is logged in:', response.authResponse);
                    }
                });
            }
        }, [fbReady, checkLoginStatus]);
        
        return (
            <div>
                {loginStatus?.status === 'connected' && (
                    <p>Logged in as: {loginStatus.authResponse.userID}</p>
                )}
            </div>
        );
    };
    ```
    
    **Note:** Your app currently uses **OAuth redirect flow** (window.location.href redirect), which is different from SDK popup login. The SDK functions are available if you want to:
    - Check if a user is already logged into Facebook
    - Use Facebook Login button (popup method) as an alternative
    - Access Facebook user data without redirecting away from your page

12. **Add Facebook Login Button**:
    
    Facebook provides these codes for the login button:
    
    **HTML Button:**
    ```html
    <fb:login-button 
      scope="public_profile,email"
      onlogin="checkLoginState();">
    </fb:login-button>
    ```
    
    **JavaScript Function:**
    ```javascript
    function checkLoginState() {
      FB.getLoginStatus(function(response) {
        statusChangeCallback(response);
      });
    }
    ```
    
    **React Implementation:**
    
    A `FacebookLoginButton` component has been created that implements these functions in React. It's already integrated into your `SocialMediaConnectionPage` for Facebook connections.
    
    **Usage Example:**
    ```javascript
    import FacebookLoginButton from '../components/FacebookLoginButton';
    
    <FacebookLoginButton
        scope="public_profile,email,pages_read_engagement,pages_show_list"
        buttonText="Login with Facebook"
        onLoginSuccess={(response) => {
            // Handle successful login
            // response.status === 'connected'
            // response.authResponse.accessToken contains the token
            console.log('Logged in:', response);
        }}
        onLoginFailure={(response) => {
            // Handle login failure or cancellation
            console.log('Login failed:', response);
        }}
    />
    ```
    
    **How it works:**
    - When user clicks the button, it calls `FB.login()` (SDK popup method)
    - After login, it automatically calls `checkLoginState()` (the function Facebook provided)
    - The `checkLoginState` function calls `FB.getLoginStatus()` to verify the login
    - Your `onLoginSuccess` callback receives the response with access token
    
    **The component implements:**
    - ✅ `<fb:login-button>` functionality (React version)
    - ✅ `checkLoginState()` function (automatically called after login)
    - ✅ `FB.getLoginStatus()` check (verifies login status)
    - ✅ Proper error handling and loading states

---

### 5. LinkedIn OAuth Setup

**Requirements:**
- LinkedIn Developer Account

**Steps:**
1. Go to [LinkedIn Developers](https://www.linkedin.com/developers/)
2. Create a new app
3. Go to "Auth" tab
4. Add redirect URL: `http://localhost:5000/api/v1/social/callback/linkedin`
5. Copy the **Client ID** and **Client Secret**
6. Add to `backend/config/config.env`:
   ```
   LINKEDIN_CLIENT_ID=your_client_id_here
   LINKEDIN_CLIENT_SECRET=your_client_secret_here
   ```

---

### 6. TikTok OAuth Setup

**Requirements:**
- TikTok Developer Account

**Steps:**
1. Go to [TikTok Developers](https://developers.tiktok.com/)
2. Create a new app
3. Copy the **Client Key** and **Client Secret**
4. Add redirect URI: `http://localhost:5000/api/v1/social/callback/tiktok`
5. **Configure App Details:**
   - **Web/Desktop URL** (Required): 
     - For development: `http://localhost:3000` (or your frontend URL)
     - For production: `https://yourdomain.com` (your actual website URL)
   - **Privacy Policy URL** (Required):
     - Enter your privacy policy URL (e.g., `https://www.termsfeed.com/live/d73323c7-01bc-4c64-bf1a-38374ddc7990`)
     - Click **"Verify URL properties"** button to verify the URL
     - TikTok will check for verification meta tags on your privacy policy page
     - If verification fails, you may need to add TikTok's verification meta tag to your privacy policy page
6. Add to `backend/config/config.env`:
   ```
   TIKTOK_CLIENT_KEY=your_client_key_here
   TIKTOK_CLIENT_SECRET=your_client_secret_here
   ```

**Important Notes:**
- **Web/Desktop URL**: This must be a publicly accessible URL (not localhost for production). For development, `http://localhost:3000` works, but you may need to use a tool like ngrok for testing.
- **Privacy Policy URL Verification**: TikTok requires verification of your privacy policy URL. Click the "Verify URL properties" button and follow TikTok's instructions. You may need to add a verification meta tag to your privacy policy page.
- **App Status**: Your app will be in "Draft" status until you complete all required fields and submit for review.

---

## Environment Variables

After setting up each platform, add the credentials to `backend/config/config.env`:

```env
# Instagram Basic Display API
INSTAGRAM_CLIENT_ID=your_instagram_client_id
INSTAGRAM_CLIENT_SECRET=your_instagram_client_secret

# YouTube Data API v3
YOUTUBE_CLIENT_ID=your_youtube_client_id
YOUTUBE_CLIENT_SECRET=your_youtube_client_secret

# Twitter OAuth 2.0
TWITTER_CLIENT_ID=your_twitter_client_id
TWITTER_CLIENT_SECRET=your_twitter_client_secret

# Facebook OAuth
FACEBOOK_CLIENT_ID=your_facebook_app_id
FACEBOOK_CLIENT_SECRET=your_facebook_app_secret

# LinkedIn OAuth 2.0
LINKEDIN_CLIENT_ID=your_linkedin_client_id
LINKEDIN_CLIENT_SECRET=your_linkedin_client_secret

# TikTok OAuth
TIKTOK_CLIENT_KEY=your_tiktok_client_key
TIKTOK_CLIENT_SECRET=your_tiktok_client_secret
```

## Important Notes

1. **Redirect URIs**: Make sure to add the exact redirect URI to each platform's settings:
   - `http://localhost:5000/api/v1/social/callback/{platform}`

2. **Production**: For production, update redirect URIs to your production domain:
   - `https://yourdomain.com/api/v1/social/callback/{platform}`

3. **Security**: Never commit your `.env` file with real credentials to version control.

4. **Testing**: You can test OAuth without all platforms configured - users can still manually enter follower counts.

## How It Works

1. User clicks "Connect [Platform]" button
2. App redirects to platform's OAuth page
3. User authorizes the app
4. Platform redirects back with an authorization code
5. Backend exchanges code for access token
6. Backend uses access token to fetch follower count
7. Follower count is saved and displayed automatically

## Troubleshooting

- **"OAuth is not configured"**: Check that environment variables are set correctly
- **Redirect URI mismatch**: Ensure redirect URI in platform settings matches exactly
- **Token exchange fails**: Verify Client ID and Secret are correct
- **No follower count**: Some platforms (like Instagram Basic Display) don't provide follower counts
