# Complete Signup & Login Testing Guide

## 🎯 Quick Start (5 Minutes)

### 1. Delete All Users
1. Go to Supabase Dashboard: https://supabase.com
2. Click your project
3. Go to **Authentication** → **Users**
4. Click the **⋮** (three dots) next to each user → **Delete user**

### 2. Restart Dev Server
```bash
# Press Ctrl+C to stop current server
npm run dev
```
Wait for: `Server running on http://localhost:3002`

### 3. Test Signup
1. Visit: http://localhost:3002/auth/sign-up
2. Open Console: **F12** → **Console tab**
3. Enter credentials:
   - Email: `test@example.com`
   - Password: `Password123!`
   - Repeat: `Password123!`
4. Click **Sign Up**

### 4. Watch Console
You should see:
```
[Sign Up] Form validation passed
[Sign Up] Creating Supabase client...
[Sign Up] Attempting to sign up with email: test@example.com
[Sign Up] User created successfully
```

✅ **Success if:** Redirected to dashboard or success page

---

## 📊 Detailed Testing Steps

### Step 1: Verify Environment is Ready

```bash
# 1. Navigate to project
cd c:\Users\Nokia\Downloads\v_c-main\v_c-main

# 2. Check .env.local exists and has Supabase credentials
type .env.local | findstr SUPABASE_URL
type .env.local | findstr SUPABASE_ANON_KEY
```

✅ Should output two lines with your credentials

---

### Step 2: Clear All Test Data

**Option A: Delete via Dashboard (Recommended)**
1. Open https://supabase.com
2. Click your project
3. **Authentication** → **Users**
4. For each user:
   - Click **⋮** → **Delete user**
   - Confirm deletion

**Option B: Delete via Terminal (Advanced)**
```bash
# View current browser local storage
# F12 → Application → Local Storage → http://localhost:3002
# Look for key: "sb-[project-id]-auth-token"
# Delete the auth token cookie in browser DevTools

# Or clear entire browser data for localhost:
# Ctrl+Shift+Delete → Select localhost:3002 → Clear
```

---

### Step 3: Start Fresh Dev Server

```bash
# In project directory
cd c:\Users\Nokia\Downloads\v_c-main\v_c-main

# Kill any existing node processes (if needed)
taskkill /F /IM node.exe

# Start fresh
npm run dev
```

✅ Wait for: **`Server running on http://localhost:3002`**

---

### Step 4: Security - Clear Browser Cache

```
F12 (or Ctrl+Shift+I)
→ Application tab
→ Storage section
→ Click "Clear site data" button
→ Check "Cookies", "Cache Storage", "Indexed DB"
→ Clear
```

Or use keyboard: **Ctrl+Shift+Delete**

---

### Step 5: Test Signup Workflow

#### Part A: Access Signup Page
1. Visit: http://localhost:3002/auth/sign-up
2. Verify form appears with:
   - Email input
   - Password input
   - Repeat Password input
   - Sign Up button

#### Part B: Open Console & Prepare to Watch
```
F12 → Console tab
Clear existing messages: Ctrl+L
```

#### Part C: Fill Form
- **Email:** Use a UNIQUE email each test (e.g., `test1@example.com`, `test2@example.com`)
- **Password:** `TestPassword123!` (6+ characters)
- **Repeat:** `TestPassword123!` (must match)
- Click **Sign Up**

#### Part D: Watch Console
Expected logs (in order):

```
[Sign Up] Validating form...
[Sign Up] Form validation passed
[Sign Up] Creating Supabase client...
[Sign Up] Attempting to sign up with email: test1@example.com
[Sign Up] Sign up response received {hasError: false, hasUser: true, userId: "..."}
[Sign Up] User created successfully: [user-uuid]
[Sign Up] Attempting to insert into users table...
[Sign Up] User record created in database
[Sign Up] Attempting to create default workspace...
[Sign Up] Workspace created: [workspace-uuid]
[Sign Up] User added to workspace as owner
[Sign Up] Email verification required, redirecting to success page
```

#### Part E: Expected Redirect
- ✅ If **email verification OFF**: → `/dashboard`
- ✅ If **email verification ON**: → `/auth/sign-up-success`

---

### Step 6: Verify User Was Created

**In Supabase Dashboard:**
1. Go to https://supabase.com
2. Select your project
3. Click **Authentication** → **Users**
4. You should see your new user:
   - Email: `test1@example.com`
   - User ID: `[uuid]`
   - Created: `[timestamp]`

---

### Step 7: Test Login Workflow

#### Part A: Access Login Page
1. Visit: http://localhost:3002/auth/login
2. Verify form appears with:
   - Email input
   - Password input
   - Login button

#### Part B: Clear Console
```
Open F12 Console
Ctrl+L to clear previous logs
```

#### Part C: Enter Credentials
- **Email:** `test1@example.com` (the one you just created)
- **Password:** `TestPassword123!`
- Click **Login**

#### Part D: Watch Console
Expected logs:

```
[Login] Starting authentication...
[Login] Creating Supabase client...
[Login] Supabase client initialized successfully
[Login] Attempting sign in with email: test1@example.com
[Login] Auth response received {hasError: false, hasData: true}
[Login] Authentication successful, user: [user-uuid]
[Login] Redirecting to dashboard
```

#### Part E: Expected Result
✅ Redirects to `/dashboard`

---

## 🧪 Test Scenarios

### Scenario 1: Signup with Invalid Inputs
| Input | Expected Result |
|-------|-----------------|
| Empty email | ❌ "All fields are required" |
| Email without `@` | ❌ "Please enter a valid email" |
| Password < 6 chars | ❌ "Password must be at least 6 characters" |
| Passwords don't match | ❌ "Passwords do not match" |

### Scenario 2: Signup with Duplicate Email
1. Create user with `test@example.com`
2. Try creating again with same email
3. Expected: ❌ "This email is already registered"

### Scenario 3: Login with Wrong Password
1. Create user with `test@example.com` / `Password123!`
2. Try login with `WrongPassword`
3. Expected: ❌ "Invalid email or password"

### Scenario 4: Login with Non-existent Email
1. Try login with `nonexistent@example.com`
2. Expected: ❌ "No account found with this email"

### Scenario 5: Network Error Simulation
1. Disconnect internet
2. Try signup
3. Expected: ❌ "Unable to connect to authentication service"

---

## 🔍 Console Log Reference

### Signup Logs
```
[Sign Up] Validating form...
[Sign Up] Form validation passed
[Sign Up] Creating Supabase client...
[Sign Up] Attempting to sign up with email: test@example.com
[Sign Up] Sign up response received
[Sign Up] User created successfully: [id]
[Sign Up] Attempting to insert into users table...
[Sign Up] User record created in database
[Sign Up] Attempting to create default workspace...
[Sign Up] Workspace created: [id]
[Sign Up] User added to workspace as owner
[Sign Up] Email verification required, redirecting to success page
```

### Login Logs
```
[Login] Starting authentication...
[Login] Creating Supabase client...
[Login] Supabase client initialized successfully
[Login] Attempting sign in with email: test@example.com
[Login] Auth response received
[Login] Authentication successful, user: [id]
[Login] Redirecting to dashboard
```

### Error Logs Pattern
```
[Sign Up] Form validation passed
[Sign Up] Error during sign up: [error message]
```

---

## ✅ Success Checklist

After testing, verify:
- [ ] Dev server starts without errors
- [ ] Can access signup page
- [ ] Can access login page
- [ ] Console shows detailed [Sign Up] logs
- [ ] Signup creates user in Supabase
- [ ] User appears in Supabase dashboard
- [ ] Can login with created credentials
- [ ] Console shows detailed [Login] logs
- [ ] Login redirects to dashboard
- [ ] No network errors in console
- [ ] No auth errors in Supabase logs

---

## 🆘 Troubleshooting

### Issue: "Supabase client initialized successfully" doesn't appear
**Solution:** Check `.env.local` has `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY`

### Issue: "User created successfully" doesn't appear
**Solution:** Check Supabase project is active, not suspended

### Issue: Signup redirects wrong page
**Solution:** Check email verification setting in Supabase Settings

### Issue: Can't see console logs
**Solution:** 
1. Press **F12**
2. Click **Console** tab
3. Look for messages starting with `[Sign Up]` or `[Login]`
4. Expand errors by clicking ▶

### Issue: Browser cache issues
**Solution:** Clear cache: **Ctrl+Shift+Delete**

---

## 📝 File Locations

| File | Purpose |
|------|---------|
| `app/auth/sign-up/page.tsx` | Signup form with logging |
| `app/auth/login/page.tsx` | Login form with logging |
| `lib/supabase/client.ts` | Supabase initialization |
| `.env.local` | Environment variables |

---

## 🎓 Learning Resources

- [Supabase Auth Docs](https://supabase.com/docs/guides/auth)
- [Next.js with Supabase](https://supabase.com/docs/guides/auth/server-side-rendering)
- [Browser DevTools](https://developer.chrome.com/docs/devtools/)

---

**Last Updated:** March 14, 2026
