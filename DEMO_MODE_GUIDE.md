# 🎮 SwaDesi Demo Mode Guide

## What is Demo Mode?

Demo Mode is a fallback system that allows SwaDesi to work **completely offline** without requiring Supabase backend deployment. All data is stored in your browser's localStorage.

## ✅ When Demo Mode Activates

Demo Mode automatically activates when:
- Supabase edge functions are not deployed
- Network connection to Supabase fails
- Server is unavailable or unreachable

You'll see this message in the console:
```
⚠️ Server unavailable, using demo mode for signin
```

And this toast notification:
```
📱 Demo Mode: All data is stored locally
```

## 🔧 How to Use Demo Mode

### 1. **Sign Up First**
When in demo mode, you **must sign up** before you can sign in:

1. Go to the Auth screen
2. Click on the **"Sign Up"** tab
3. Fill in all fields:
   - Name
   - Email
   - Phone
   - Password
   - Confirm Password
4. Click "Sign Up"

### 2. **Sign In Later**
After creating an account, you can sign in:

1. Click on the **"Sign In"** tab
2. Enter your email and password
3. Click "Sign In"

### 3. **What If I Try to Sign In First?**
If you try to sign in without creating an account first:
- ❌ You'll see: "No account found with this email. Please sign up first!"
- ✅ The app will automatically switch you to the Sign Up tab after 2 seconds

## 💾 What Data is Stored in Demo Mode?

All app features work in demo mode:
- ✅ **User Accounts** - Email, name, phone, points, level
- ✅ **Shopping Cart** - Products and quantities
- ✅ **Orders** - Full order history with tracking
- ✅ **Bill Uploads** - Bill data (images as object URLs)
- ✅ **Points Activity** - Complete transaction history
- ✅ **User Preferences** - Settings and favorites

### localStorage Keys Used:
```
swadesi_demo_mode       - Demo mode flag
swadesi_demo_users      - User accounts
swadesi_demo_data       - All user data (cart, orders, bills, points)
supabase_access_token   - Demo authentication token
```

## 🔄 Switching from Demo Mode to Production

When you deploy your Supabase backend:

1. **Deploy the backend** (see SUPABASE_DEPLOYMENT_GUIDE.md)
2. **Clear demo data** (optional):
   ```javascript
   localStorage.removeItem('swadesi_demo_mode');
   localStorage.removeItem('swadesi_demo_users');
   localStorage.removeItem('swadesi_demo_data');
   localStorage.removeItem('supabase_access_token');
   ```
3. **Refresh the page**
4. **Sign up again** with the real backend

The app will automatically detect the working backend and stop using demo mode.

## 🚫 Demo Mode Limitations

### Current Limitations:
- ❌ No real-time synchronization across devices
- ❌ Data is browser-specific (not shared between browsers)
- ❌ Data can be lost if you clear browser storage
- ❌ No server-side validation or security
- ❌ Bill images stored as temporary blob URLs (not persistent)
- ❌ No multi-user collaboration features

### AI Features in Demo Mode:
- ⚠️ Gemini AI features use **fallback responses**
- Smart Assistant provides generic responses
- Product analysis uses calculated estimates
- No real AI-powered recommendations

To enable AI features:
1. Get a Gemini API key from [Google AI Studio](https://makersuite.google.com/app/apikey)
2. Add it in the app (Profile → Settings)
3. AI features will activate automatically

## 🎯 Demo Mode vs Production

| Feature | Demo Mode | Production |
|---------|-----------|------------|
| Authentication | ✅ Local | ✅ Supabase Auth |
| Data Storage | 📱 localStorage | ☁️ Supabase Database |
| Cart Persistence | ✅ Browser only | ✅ Cross-device |
| Order Tracking | ✅ Local | ✅ Real-time |
| Bill Uploads | ⚠️ Blob URLs | ✅ Storage bucket |
| Points System | ✅ Local | ✅ Server-side |
| AI Features | ⚠️ Fallback | ✅ Full Gemini AI |
| Multi-device | ❌ No | ✅ Yes |
| Data Security | ⚠️ Client-side | ✅ Server-side |

## 🐛 Troubleshooting Demo Mode

### "No account found" Error
**Problem:** Trying to sign in without creating an account first

**Solution:** 
1. Switch to "Sign Up" tab
2. Create an account
3. Then sign in

### Data Not Persisting
**Problem:** Data disappears after closing browser

**Solution:**
- Check if browser is in incognito/private mode
- Ensure cookies/localStorage is enabled
- Try a different browser

### Can't Upload Bills
**Problem:** Bill images not showing after upload

**Solution:**
- Demo mode uses temporary blob URLs
- Images work during the session
- For persistent storage, deploy Supabase backend

### AI Features Not Working
**Problem:** Getting generic responses from AI assistant

**Solution:**
- Demo mode uses fallback responses by default
- Add your Gemini API key to enable AI features
- Go to Profile → Settings → Add API Key

## 📊 Checking if You're in Demo Mode

Look for these indicators:

1. **Console Messages:**
   ```
   ⚠️ Server unavailable, using demo mode
   ✅ Demo account created successfully
   ✅ Demo cart saved
   ```

2. **Toast Notification:**
   ```
   📱 Demo Mode: All data is stored locally
   ```

3. **Access Token Format:**
   - Demo: `demo_token_[base64]_[timestamp]`
   - Production: Long JWT token

## 🎓 Best Practices

### For Development:
✅ Use demo mode for quick testing
✅ Test all features locally
✅ Don't rely on it for important data

### For Production:
❌ Don't use demo mode with real users
❌ Don't store sensitive data in demo mode
✅ Always deploy Supabase backend for production
✅ Use proper authentication and security

## 🚀 Next Steps

Ready to move beyond demo mode?

1. **Deploy Supabase Backend**
   - Follow `SUPABASE_DEPLOYMENT_GUIDE.md`
   - Set up database schema
   - Deploy edge functions

2. **Configure Gemini API**
   - Get API key from Google AI Studio
   - Add to app settings
   - Enable full AI features

3. **Test Production Features**
   - Multi-device synchronization
   - Real-time updates
   - Secure authentication
   - Cloud storage

## 📞 Need Help?

- Check `SUPABASE_DEPLOYMENT_GUIDE.md` for backend setup
- Check `GEMINI_IMPLEMENTATION.md` for AI features
- Look at browser console for detailed error messages
- Check localStorage in DevTools to see stored data

---

**Remember:** Demo mode is perfect for testing and development, but always deploy the full backend for production use! 🚀
