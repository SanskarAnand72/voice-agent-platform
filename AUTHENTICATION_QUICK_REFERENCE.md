# Quick Reference: Authentication Testing

## 🎯 Testing Checklist (Do This First)

- [ ] Restart dev server: `npm run dev`
- [ ] Visit http://localhost:3002/debug
- [ ] Check that environment variables show ✅ all green
- [ ] Check "Supabase Connection Status" - should be "Authenticated" or "Unauthenticated" (not ERROR)

---

## 🔗 Quick Links

| What | URL |
|------|-----|
| **Debug Dashboard** | http://localhost:3002/debug |
| **Login Page** | http://localhost:3002/auth/login |
| **Health Check** | http://localhost:3002/api/health |
| **Supabase Dashboard** | https://supabase.com |

---

## 📊 Expected Browser Console Logs

### ✅ Successful Login Flow:
```
[Supabase Client] Initialization check: {
  urlPrefix: "https://qakxonps...",
  keyPrefix: "eyJhbGciOiJI...",
  urlPresent: true,
  keyPresent: true
}
[Login] Starting authentication...
[Login] Supabase client initialized successfully
[Login] Attempting sign in with email: test@example.com
[Login] Auth response received
[Login] Authentication successful, redirecting to dashboard
```

### ❌ Common Error Patterns:

**Missing Environment Variables:**
```
[Supabase Client] Configuration error: Missing NEXT_PUBLIC_SUPABASE_...
```
→ Solution: Edit `.env.local` and restart server

**Connection Failed:**
```
[Login] Caught exception: {message: "fetch failed"}
```
→ Solution: Check internet, verify Supabase URL is correct

**Invalid Credentials:**
```
[Login] Supabase auth error: {message: "Invalid login credentials"}
```
→ Solution: Verify email/password in Supabase Auth dashboard

---

## 🛠️ How to Read Browser Console

1. **Open:** F12 or Right-click → Inspect
2. **Select:** Console tab (usually already selected)
3. **Clear:** Ctrl+L or click the clear icon
4. **Try login** and watch what appears
5. **Expand errors** by clicking the ▶ arrows

---

## 🔄 Testing the Health Endpoint (No Login Needed)

### Using Browser:
```
http://localhost:3002/api/health
```

### Using Terminal (PowerShell):
```powershell
curl http://localhost:3002/api/health | ConvertFrom-Json | Format-List
```

### What It Shows:
- `environment.hasSupabaseUrl` → Should be `true`
- `environment.hasSupabaseKey` → Should be `true`
- `supabaseConnection.status` → Should be `unauthenticated` or `authenticated`
- `supabaseConnection.error` → Should be `null` if working

---

## ⚙️ Required Environment Variables

These must be in `.env.local`:

```
NEXT_PUBLIC_SUPABASE_URL=      [from Supabase Settings → API → URL]
NEXT_PUBLIC_SUPABASE_ANON_KEY= [from Supabase Settings → API → anon key]
NEXT_PUBLIC_BASE_URL=          http://localhost:3002
```

**Find in Supabase:**
1. Log in to https://supabase.com
2. Select your project
3. Go to Settings → API
4. Copy the values shown

---

## 🚀 Server Restart (If Something Seems Wrong)

```bash
# In terminal where server is running:
# Press Ctrl+C to stop

# Then start again:
npm run dev
```

**Wait for:** `Server running on http://localhost:3002`

Then refresh browser (Ctrl+R or Cmd+R)

---

## 📝 Test Credentials

Before testing login, verify a test user exists:

1. Go to Supabase Dashboard
2. Click "Authentication" → "Users"
3. You should see at least one test user
4. Note the email address
5. Use that email + correct password to test

---

## 🎯 Success Indicators

### ✅ Everything Working:
- Debug page shows all variables with green checkmarks
- Health endpoint returns `"error": null`
- Console logs show [Supabase Client] initialization successful
- Can log in and redirect to dashboard
- No network errors in console

### ⚠️ Signs of Configuration Problem:
- Orange/Yellow status on debug page
- Some variables showing "MISSING"
- Health endpoint returns status: 503
- Console shows [Supabase Client] Configuration error

### ❌ Signs of Connection Problem:
- Health check endpoint times out or refuses connection
- Console shows network errors
- Can't reach http://localhost:3002 in browser

---

## 🆘 If Still Stuck

1. **Check the debug page first:** http://localhost:3002/debug
2. **Open browser console:** F12 → Console tab
3. **Review this file:** Read the sections above that match your errors
4. **Check AUTHENTICATION_DEBUG.md** for detailed solutions
5. **Restart everything:** Stop server, clear cache, start again

---

**Last Updated:** March 14, 2026
