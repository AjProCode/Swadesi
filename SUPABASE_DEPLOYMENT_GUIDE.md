# 🚀 SwaDesi Supabase Deployment Guide

This guide will help you deploy the complete Supabase backend for SwaDesi.

## 📋 Prerequisites

- Supabase account (already connected)
- Supabase CLI installed (optional but recommended)
- Your Supabase project URL and keys (already configured)

## 🗄️ Step 1: Set Up Database Schema

### Option A: Using Supabase Dashboard (Recommended for beginners)

1. **Open your Supabase Dashboard**
   - Go to https://supabase.com/dashboard
   - Select your SwaDesi project

2. **Navigate to SQL Editor**
   - Click on the "SQL Editor" icon in the left sidebar
   - Click "New Query"

3. **Copy and Execute Schema**
   - Open `/supabase_schema.sql` file in this project
   - Copy the entire contents
   - Paste into the SQL Editor
   - Click "Run" or press `Ctrl/Cmd + Enter`

4. **Verify Tables Created**
   - Go to "Table Editor" in the left sidebar
   - You should see these tables:
     - `users`
     - `cart_items`
     - `orders`
     - `bill_uploads`
     - `points_activity`
     - `vendors`

### Option B: Using Supabase CLI (For advanced users)

```bash
# Install Supabase CLI if not already installed
npm install -g supabase

# Login to Supabase
supabase login

# Link to your project
supabase link --project-ref YOUR_PROJECT_ID

# Run migrations
supabase db push
```

## ⚡ Step 2: Deploy Edge Functions

### Option A: Using Supabase Dashboard

1. **Navigate to Edge Functions**
   - In your Supabase Dashboard
   - Click "Edge Functions" in the left sidebar

2. **Create New Function**
   - Click "Create new function"
   - Name it: `make-server`

3. **Copy Function Code**
   - Open `/supabase/functions/make-server/index.ts`
   - Copy the entire contents
   - Paste into the function editor

4. **Deploy Function**
   - Click "Deploy" button
   - Wait for deployment to complete (usually 30-60 seconds)

5. **Verify Deployment**
   - The function should show as "Active"
   - Note the function URL (it will be something like:
     `https://YOUR_PROJECT_ID.supabase.co/functions/v1/make-server`)

### Option B: Using Supabase CLI (Recommended)

```bash
# Navigate to your project root
cd /path/to/swadesi

# Deploy the function
supabase functions deploy make-server

# Verify deployment
supabase functions list
```

## 🔐 Step 3: Configure Environment Variables

Your edge function needs access to Supabase credentials. These are automatically available in Supabase Edge Functions as:

- `SUPABASE_URL` - Your project URL
- `SUPABASE_ANON_KEY` - Your public anon key
- `SUPABASE_SERVICE_ROLE_KEY` - Your service role key (automatically injected)

**No manual configuration needed!** ✅

## 🗂️ Step 4: Set Up Storage Buckets

The schema automatically creates storage buckets, but verify they exist:

1. **Go to Storage in Dashboard**
   - Click "Storage" in left sidebar

2. **Verify Buckets Exist**
   - `bill-images` - For uploaded bills
   - `vendor-logos` - For vendor logos
   - `product-images` - For product images

3. **Check Bucket Policies**
   - Each bucket should have policies for:
     - Authenticated users can upload
     - Public read access
     - Users can delete their own files

## ✅ Step 5: Test the Connection

### Test Authentication

1. **Open your SwaDesi app**
2. **Try to sign up**
   - Go to the Auth screen
   - Enter email, password, name, and phone
   - Click "Sign Up"

3. **Expected Result**
   - ✅ No more "Failed to fetch" errors
   - ✅ Account created successfully
   - ✅ Automatic login to the app
   - ✅ Welcome points (100) added

### Test Data Persistence

1. **Add items to cart**
2. **Refresh the page**
3. **Expected Result**
   - ✅ Cart items persist across page reloads
   - ✅ User data is maintained

## 🔍 Troubleshooting

### "Failed to fetch" Error Still Appearing

**Problem**: Edge function not deployed or not accessible

**Solutions**:
1. Verify edge function is deployed and "Active" in dashboard
2. Check function logs for errors:
   - Dashboard → Edge Functions → make-server → Logs
3. Ensure CORS is not being blocked by browser

### "Authentication expired" Error

**Problem**: Token verification failing

**Solutions**:
1. Check that RLS policies are correctly set on tables
2. Verify service role key is set in edge function environment
3. Try clearing browser cache and localStorage

### Tables Not Created

**Problem**: SQL script didn't run completely

**Solutions**:
1. Check for syntax errors in SQL Editor
2. Run schema script in smaller chunks
3. Manually create tables using Table Editor

### Storage Upload Failing

**Problem**: Storage buckets or policies not configured

**Solutions**:
1. Manually create buckets in Storage section
2. Set bucket to "Public"
3. Add storage policies from the schema

## 📊 Step 6: Monitor Your Backend

### Check Edge Function Logs

```bash
# Using CLI
supabase functions logs make-server

# Or in Dashboard:
# Edge Functions → make-server → Logs
```

### Monitor Database Activity

1. **Go to Database → Logs**
2. **Filter by table name**
3. **Watch for errors or slow queries**

### Check Storage Usage

1. **Go to Storage**
2. **View usage statistics**
3. **Monitor upload/download activity**

## 🎉 Success Checklist

Before considering deployment complete, verify:

- [ ] All database tables created successfully
- [ ] Edge function deployed and showing as "Active"
- [ ] Storage buckets created with correct policies
- [ ] User can sign up without errors
- [ ] User can sign in successfully
- [ ] Cart data persists across page reloads
- [ ] Orders can be created and tracked
- [ ] Bills can be uploaded
- [ ] Points activity is recorded

## 🔐 Security Best Practices

### Important Notes:

1. **Never expose service role key**
   - It's automatically available in edge functions
   - Don't add it to your frontend code

2. **Row Level Security (RLS) is enabled**
   - Users can only access their own data
   - Policies are enforced at database level

3. **Storage is secured**
   - Users can only upload to their own folders
   - Public read access for viewing images

4. **Authentication is handled by Supabase Auth**
   - Secure token-based authentication
   - Automatic token refresh
   - Password hashing and salting

## 📚 Additional Resources

- [Supabase Documentation](https://supabase.com/docs)
- [Edge Functions Guide](https://supabase.com/docs/guides/functions)
- [Row Level Security](https://supabase.com/docs/guides/auth/row-level-security)
- [Storage Guide](https://supabase.com/docs/guides/storage)

## 🆘 Need Help?

If you encounter issues:

1. Check Supabase Dashboard logs
2. Review browser console for errors
3. Check edge function logs
4. Verify all tables and policies exist
5. Test with demo mode disabled

## 🎯 What's Next?

After successful deployment:

1. **Test all features thoroughly**
   - Sign up/Sign in
   - Shopping cart
   - Order placement
   - Bill uploads
   - Points system

2. **Configure Gemini API** (Optional)
   - Add your Gemini API key in the app
   - Enable AI-powered smart assistant

3. **Customize vendor data**
   - Add real vendors to database
   - Upload product catalogs
   - Set up product images

4. **Launch to users!** 🚀

---

## 📝 Quick Reference

### Important Files
- `/supabase_schema.sql` - Complete database schema
- `/supabase/functions/make-server/index.ts` - Main edge function
- `/utils/supabase/auth.ts` - Frontend auth utilities
- `/utils/supabase/database.ts` - Frontend database utilities

### Key Endpoints
```
POST   /make-server/signup              - Create new user
POST   /make-server/signin              - Sign in user
GET    /make-server/user/profile        - Get user profile
PUT    /make-server/user/profile        - Update user profile
GET    /make-server/cart                - Get cart items
POST   /make-server/cart                - Save cart
DELETE /make-server/cart                - Clear cart
GET    /make-server/orders              - Get orders
POST   /make-server/orders              - Create order
PUT    /make-server/orders/:id          - Update order
GET    /make-server/bills               - Get bills
POST   /make-server/bills/upload        - Upload bill
PUT    /make-server/bills/:id           - Update bill
GET    /make-server/points/activity     - Get points history
POST   /make-server/points/activity     - Add points activity
DELETE /make-server/user/data           - Clear all user data
```

### Database Tables
```
users             - User profiles and gamification
cart_items        - Shopping cart items
orders            - Order history and tracking
bill_uploads      - Uploaded bills for verification
points_activity   - Points transaction history
vendors           - Vendor profiles and management
```

---

**🎊 Congratulations!** Your SwaDesi backend is now fully deployed and ready to use!
