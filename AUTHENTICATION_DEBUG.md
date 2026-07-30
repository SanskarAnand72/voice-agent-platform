# Supabase Authentication Debug Guide

## Overview
This guide helps you debug and fix Supabase authentication issues in the Voice AI Dashboard.

## Quick Troubleshooting

### 1. **Check Your Environment Variables**
The application requires these environment variables in `.env.local`:

```
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
NEXT_PUBLIC_BASE_URL=http://localhost:3002
```

**To find your credentials:**
1. Go to [Supabase Dashboard](https://supabase.com)
2. Select your project
3. Go to **Settings → API**
4. Copy the **URL** and **anon key** (public), not the service role key

### 2. **Restart the Dev Server**
After changing `.env.local`, you MUST restart the dev server:
```bash
# Stop the current server (Ctrl+C)
npm run dev
```

### 3. **Check the Debug Dashboard**
Visit `http://localhost:3002/debug` to see:
- ✅ Supabase connection status
- ✅ Environment variables loaded
- ✅ Detailed error messages
- ✅ Troubleshooting tips

## Common Errors & Fixes

### Error: "Unable to connect to authentication service"

**Causes & Solutions:**

1. **Invalid Supabase Credentials**
   - [ ] Verify `NEXT_PUBLIC_SUPABASE_URL` matches your project URL
   - [ ] Verify `NEXT_PUBLIC_SUPABASE_ANON_KEY` is the public anon key (not service role)
   - [ ] Check for typos or extra spaces

2. **Environment Variables Not Loaded**
   - [ ] Restart the dev server after editing `.env.local`
   - [ ] Clear browser cache (Ctrl+Shift+Delete)
   - [ ] Check server logs for:"`[Supabase Client] Initialization check:`"

3. **Network/CORS Issues**
   - [ ] Verify your internet connection
   - [ ] Check if Supabase project is active
   - [ ] Verify `NEXT_PUBLIC_BASE_URL=http://localhost:3002` is correct
   - [ ] Check browser console (F12) for network errors

### Error: "Configuration Error"

Your environment variables are missing or invalid. Steps to fix:
1. Open `.env.local` in your project root
2. Add missing variables from your Supabase project
3. Verify no typos (case-sensitive!)
4. Restart dev server
5. Refresh browser

### Error: "Invalid email or password"

User credentials issue:
- [ ] Verify user exists in Supabase Auth
- [ ] Confirm email is correct (case-sensitive)
- [ ] Check if account is active
- [ ] Test credentials in Supabase dashboard

## Browser Console Debugging

Open browser developer tools (**F12** or **Right-click → Inspect**) and look for login logs:

```
[Supabase Client] Initialization check:
  urlPrefix: "https://qakxonps..." 
  keyPrefix: "eyJhbGciOiJI..."
  urlPresent: true
  keyPresent: true

[Login] Starting authentication...
[Login] Supabase client initialized successfully
[Login] Attempting sign in with email: user@example.com
```

### If you see errors:
1. Click on the error message to expand details
2. Note the complete error message
3. Compare with solutions in "Common Errors" section above

## Testing the Connection

### Method 1: Health Check Endpoint
```bash
curl http://localhost:3002/api/health
```

This returns JSON with:
- `environment.hasSupabaseUrl` - Is URL configured?
- `environment.hasSupabaseKey` - Is key configured?
- `supabaseConnection.status` - Connection status
- `supabaseConnection.error` - Any errors

### Method 2: Debug Dashboard
Visit `http://localhost:3002/debug` for a visual interface.

### Method 3: Test Login
1. Go to `http://localhost:3002/auth/login`
2. Enter test credentials
3. Check browser console (F12) for detailed logs

## Verification Checklist

- [ ] `.env.local` file exists in project root
- [ ] `NEXT_PUBLIC_SUPABASE_URL` is not empty (starts with `https://`)
- [ ] `NEXT_PUBLIC_SUPABASE_ANON_KEY` is not empty (starts with `eyJ...`)
- [ ] No trailing spaces in environment variables
- [ ] Dev server has been restarted after editing `.env.local`
- [ ] Browser has been refreshed (Ctrl+R or Cmd+R)
- [ ] Supabase project is active and not suspended
- [ ] Test user exists in Supabase Auth console

## File Changes Made

### 1. **lib/supabase/client.ts**
- Added detailed logging for environment variable loading
- Better error messages when variables missing
- Clearer debug output in browser console

### 2. **app/auth/login/page.tsx**
- Enhanced error handling with specific error types
- Added detailed console logging for debugging
- Better error messages for network issues
- Validation of email/password before submission

### 3. **app/api/health/route.ts** (NEW)
- Health check endpoint to verify Supabase connectivity
- Returns environment configuration status
- Helpful for debugging without touching the login form

### 4. **app/debug/page.tsx** (NEW)
- Visual debug dashboard at `/debug`
- Shows real-time Supabase connection status
- Lists all environment variables
- Provides troubleshooting steps

## Next Steps

1. **Verify credentials** - Check your `.env.local`
2. **Restart server** - Kill and restart `npm run dev`
3. **Test connection** - Visit `/debug` or `/api/health`
4. **Check logs** - Open browser console (F12)
5. **Review errors** - Compare errors to this guide

## Additional Resources

- [Supabase Auth Documentation](https://supabase.com/docs/guides/auth)
- [Supabase SSR Guide](https://supabase.com/docs/guides/auth/server-side-rendering)
- [Next.js Environment Variables](https://nextjs.org/docs/basic-features/environment-variables)

## Support

If problems persist:
1. Check the debug dashboard: `http://localhost:3002/debug`
2. Review browser console errors (F12)
3. Verify all .env.local variables are set
4. Restart the dev server
5. Clear browser cache and cookies for localhost:3002

---

**Last Updated:** March 14, 2026
