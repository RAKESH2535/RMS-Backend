# Microsoft SSO Integration for RMS Admin Login

This implementation adds Microsoft Single Sign-On (SSO) authentication for admin users in the Rent Management System.

## Features Added

1. **Microsoft SSO Login Button**: Added for admin users only
2. **Traditional Login**: Still available as fallback option
3. **Automatic Role Assignment**: SSO users are automatically assigned SuperAdmin role
4. **MSAL Integration**: Uses @azure/msal-browser and @azure/msal-react
5. **User Profile Retrieval**: Gets user information from Microsoft Graph API

## Files Created/Modified

### New Files
- `src/Utils/msalConfig.js` - MSAL configuration
- `src/Utils/graphApiUtils.js` - Microsoft Graph API utilities
- `src/Component/SSOLogin.jsx` - SSO login component

### Modified Files
- `src/App.js` - Added MsalProvider wrapper
- `src/Component/AdminLogin.jsx` - Added SSO option for admin login
- `src/ProtectedRoute.jsx` - Enhanced to handle SSO authentication
- `package.json` - Added MSAL dependencies

## Setup Instructions

### 1. Azure AD App Registration

1. **Go to Azure Portal**: https://portal.azure.com
2. **Navigate to**: Azure Active Directory > App registrations
3. **Click**: "New registration"
4. **Fill out**:
   - Name: "RMS Admin SSO"
   - Supported account types: "Accounts in this organizational directory only"
   - Redirect URI: "Single-page application (SPA)" - `http://localhost:3000`
5. **Click**: "Register"

### 2. Configure Authentication

1. **In your app registration**, go to "Authentication"
2. **Add Platform**: Web
3. **Redirect URIs**: 
   - `http://localhost:3000`
   - `http://localhost:3000/dashboard`
4. **Logout URL**: `http://localhost:3000`
5. **Check**: "Access tokens" and "ID tokens"
6. **Save**

### 3. API Permissions

1. **Go to**: "API permissions"
2. **Add permission**: Microsoft Graph > Delegated permissions
3. **Select**: User.Read
4. **Grant admin consent** for your organization

### 4. Update Environment Variables

1. **Copy Application (client) ID** from "Overview" page
2. **Copy Directory (tenant) ID** from "Overview" page
3. **Update** `.env` file in the root of your React app:

```bash
# Microsoft SSO Configuration
REACT_APP_CLIENT_ID=your_actual_client_id_here
REACT_APP_CLIENT_SECRET=your_actual_client_secret_here
REACT_APP_TENANT_ID=your_actual_tenant_id_here
REACT_APP_REDIRECT_URI=http://localhost:3000

# Backend API Configuration
REACT_APP_API_URL=http://localhost:5000
```

4. **Restart your development server** after updating .env file

### 5. Production Configuration

For production deployment, update:
- Redirect URIs in Azure AD to include production URLs
- Update `redirectUri` in `msalConfig.js`
- Ensure HTTPS is used in production

## Usage

1. **Start the application**: `npm start`
2. **Navigate to login page**
3. **Select "Admin" tab**
4. **Click "Sign in with Microsoft"** button
5. **Complete Microsoft authentication**
6. **Automatically redirected to dashboard** with SuperAdmin privileges

## SSO User Experience

- **First-time users**: Will see Microsoft login popup
- **Returning users**: May be automatically signed in (SSO)
- **User info stored**: Display name, email, and user ID
- **Automatic role**: All SSO users get SuperAdmin role
- **Logout**: Clears both local session and Microsoft session

## Troubleshooting

### Common Issues

1. **Redirect URI Mismatch (AADSTS50011)**:
   - **Error**: "The redirect URI specified in the request does not match the redirect URIs configured"
   - **Solution**: In Azure Portal → App registrations → Authentication, add these URIs:
     - `http://localhost:3000`
     - `http://localhost:3000/`
     - `http://localhost:3000/dashboard`
   - **Platform**: Must be "Single-page application (SPA)"
   - **Alternative**: Update `.env` file `REACT_APP_REDIRECT_URI` to match Azure AD configuration

2. **Popup blocked**: Ensure browser allows popups for localhost
3. **Permission errors**: Ensure User.Read permission is granted
4. **CORS errors**: Verify the app is registered as SPA in Azure AD

### Error Messages

- "Failed to login with Microsoft": Check Azure AD configuration
- "Access denied": User may not have permission to access the app
- "Invalid client": Client ID may be incorrect

## Security Considerations

- **Token storage**: Uses localStorage (consider sessionStorage for higher security)
- **Role assignment**: Automatically assigns SuperAdmin - customize as needed
- **Session management**: Handles both MSAL and local session cleanup
- **HTTPS required**: For production deployments

## Customization

### Role Assignment
Modify `SSOLogin.jsx` to implement custom role assignment logic:

```javascript
// Example: assign role based on user's email domain
const userEmail = userProfile.mail || userProfile.userPrincipalName;
const role = userEmail.endsWith('@yourdomain.com') ? 'SuperAdmin' : 'Owner';
localStorage.setItem("role", role);
```

### UI Customization
Modify the Microsoft button styling in `SSOLogin.jsx`:

```javascript
style={{
  backgroundColor: "#0078d4", // Microsoft blue
  borderColor: "#0078d4",
  // ... other styles
}}
```

## Integration Notes

- **Backward Compatibility**: Traditional email/password login still works
- **User Data**: SSO user data stored alongside traditional user data
- **Dashboard Access**: SSO users access the same dashboard as traditional admins
- **Logout**: Handles both local and Microsoft session cleanup

## Support

For issues or questions:
1. Check Azure AD logs for authentication errors
2. Review browser console for JavaScript errors
3. Verify all configuration steps completed
4. Test with different browsers/incognito mode