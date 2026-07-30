# Supabase Authentication Reset Guide

## ⚠️ Important Before Starting
- You are about to delete ALL existing users from your Supabase authentication
- This action cannot be undone
- Make sure you have backed up any important user data
- This is best done in a development environment

---

## 📋 Step 1: Delete Existing Users from Supabase

### Method 1: Using Supabase Dashboard (Recommended)

1. **Go to Supabase Dashboard:**
   - Open https://supabase.com
   - Sign in to your account
   - Select your project

2. **Navigate to Authentication:**
   - Click **"Authentication"** in the left sidebar
   - Click **"Users"** tab

3. **Select and Delete Users:**
   - You'll see a list of all users
   - For each user:
     - Click the **three dots (⋮)** next to the user
     - Select **"Delete user"**
     - Confirm the deletion
   - Repeat for all users

4. **Verify Deletion:**
   - After deleting all users, the table should be empty
   - Refresh the page to confirm

---

## 🔧 Step 2: Reset Authentication Configuration

### Reset Email Confirmation Settings (Optional)

1. **Go to Authentication Settings:**
   - In Supabase Dashboard, click **Settings** (gear icon)
   - Select **"Authentication"** from the left menu

2. **Email Verification (Optional):**
   - Look for **"Email Verification"** section
   - You can toggle email verification:
     - **OFF** = Users can sign up without email confirmation (faster for testing)
     - **ON** = Users must confirm email before accessing app (recommended for production)

3. **Email Redirect URLs:**
   - Look for **"Redirect URLs"** section
   - Make sure `http://localhost:3002` and `/auth/sign-up-success` are listed
   - Format should be: `http://localhost:3002/auth/sign-up-success`

---

## 🚀 Step 3: Test Signup Works

### Test the Signup Flow:

1. **Start your dev server:**
   ```bash
   npm run dev
   ```
   Wait for: `Server running on http://localhost:3002`

2. **Clear browser data:**
   - Open Developer Console: **Ctrl+Shift+Delete** (or F12 → Application)
   - Clear all cookies and cache for `localhost:3002`

3. **Go to signup page:**
   - Visit: http://localhost:3002/auth/sign-up
   - You should see the signup form

4. **Create a test account:**
   - **Email:** test@example.com (or any test email)
   - **Password:** TestPassword123! (at least 6 characters)
   - **Repeat Password:** TestPassword123!

5. **Watch the browser console:**
   - Press **F12** to open Developer Tools
   - Go to **Console** tab
   - You should see logs like:
     ```
     [Sign Up] Validating form...
     [Sign Up] Form validation passed
     [Sign Up] Creating Supabase client...
     [Sign Up] Attempting to sign up with email: test@example.com
     [Sign Up] Sign up response received
     [Sign Up] User created successfully: [user-id]
     [Sign Up] Redirecting to dashboard
     ```

6. **Expected behavior:**
   - ✅ If email verification is OFF: Redirects directly to dashboard
   - ✅ If email verification is ON: Shows success page, asks to check email
   - ❌ If error: Check console for detailed error message

---

## ✅ Step 4: Verify User Creation

### Check User Was Created:

1. **In Supabase Dashboard:**
   - Go to **Authentication** → **Users**
   - You should see your new test user listed
   - Verify email is correct

2. **In Browser:**
   - If redirected to dashboard successfully, user was created
   - Check browser console for success logs

---

## 🐛 Troubleshooting

### Problem: "Unable to connect to authentication service"

**Solutions:**
1. Check `/debug` page: http://localhost:3002/debug
2. Verify environment variables are loaded
3. Restart dev server: `npm run dev`
4. Clear browser cache: Ctrl+Shift+Delete

### Problem: "User already registered"

**Solutions:**
1. User already exists in Supabase
2. Use a different email address for testing
3. Delete the user from Supabase dashboard and try again
4. Check if you're using the same email in different environments

### Problem: Email verification not working

**Solutions:**
1. Check email verification is enabled in Supabase Settings
2. Check redirect URLs are correct in Supabase dashboard
3. Look for email in spam folder
4. Try disabling email verification for testing (Settings → Email Verification)

### Problem: Redirects to wrong URL

**Solutions:**
1. Verify `NEXT_PUBLIC_BASE_URL=http://localhost:3002` in `.env.local`
2. Check redirect URLs in Supabase Settings
3. Restart dev server after environment variable changes

---

## 📊 Step 5: Monitor Login & Signup

### Console Logs to Expect:

**Successful Signup:**
```
[Sign Up] Form validation passed
[Sign Up] Creating Supabase client...
[Sign Up] Attempting to sign up with email: test@example.com
[Sign Up] Sign up response received
[Sign Up] User created successfully: uuid-here
[Sign Up] Redirecting to dashboard
```

**Error During Signup:**
```
[Sign Up] Error during sign up: [error message]
[Sign Up] Attempting to handle signup response...
```

---

## 🔄 If You Need to Reset Again

1. **Delete users from Supabase dashboard** (repeat Step 1)
2. **Clear browser cache:** Ctrl+Shift+Delete
3. **Restart dev server:** Kill (Ctrl+C) and run `npm run dev`
4. **Try signup again** (repeat Step 3)

---

## ✨ Code Files Involved

- `app/auth/sign-up/page.tsx` - Signup form (enhanced with logging)
- `lib/supabase/client.ts` - Supabase client initialization
- `lib/supabase/server.ts` - Server-side Supabase client
- `lib/supabase/middleware.ts` - Session management
- `.env.local` - Environment variables

---

## 📝 Production Recommendations

Once testing is complete:

1. **Enable Email Verification** in Supabase Settings
2. **Set Proper Redirect URLs** (your production domain)
3. **Use Strong Password Policies** in Supabase Settings
4. **Enable 2FA/MFA** for additional security
5. **Set Rate Limits** to prevent abuse
6. **Review Auth Provider Settings** for any additional security options

---

## 🆘 Still Having Issues?

1. **Check debug page:** http://localhost:3002/debug
2. **Check health endpoint:** http://localhost:3002/api/health
3. **Review browser console:** F12 → Console tab
4. **Check Supabase status:** https://status.supabase.com
5. **Review AUTHENTICATION_DEBUG.md** in your project

---

**Last Updated:** March 14, 2026
