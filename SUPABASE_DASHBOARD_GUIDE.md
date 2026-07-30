# Supabase Dashboard - User Management & Auth Config

## 🎯 Quick Navigation

| Task | Path in Dashboard |
|------|-------------------|
| Delete Users | Authentication → Users → Click ⋮ |
| Email Settings | Settings → Authentication → Email Verification |
| Redirect URLs | Settings → Authentication → Redirect URLs |
| API Keys | Settings → API → URL & Anon Key |
| View Logs | Settings → Logs |

---

## 👥 Deleting Users (Step by Step)

### Method 1: Individual User Deletion (Recommended)

1. **Open Supabase Dashboard**
   - Go to https://supabase.com
   - Sign in with your account
   - Select your project

2. **Navigate to Users**
   - Left sidebar → **Authentication**
   - Click **Users** tab
   - You'll see all registered users in a table

3. **Delete Each User**
   - Find the user you want to delete
   - Click the **⋮** (three dots) at the right end of the row
   - Select **"Delete user"** from dropdown menu
   - Confirm in the modal dialog

4. **Repeat for All Users**
   - Continue until all users are deleted
   - The table should be empty

5. **Verify Deletion**
   - Refresh the page (F5)
   - Users list should be empty

### Example: Deleting 3 Users
```
1. Click ⋮ next to "user1@example.com" → Delete user → Confirm
2. Click ⋮ next to "user2@example.com" → Delete user → Confirm
3. Click ⋮ next to "user3@example.com" → Delete user → Confirm
4. Refresh page (F5) → Table is now empty
```

---

## ⚙️ Email Verification Settings

### Location
**Settings → Authentication → Email Verification**

### What Does Email Verification Do?

**When ENABLED (Recommended for Production):**
- ✅ Users must confirm their email before accessing the app
- ✅ Email verification link sent after signup
- ✅ User redirected to confirmation page
- ✅ Better security - ensures valid email addresses

**When DISABLED (Good for Testing):**
- ✅ Users can access app immediately after signup
- ✅ No email confirmation needed
- ✅ Faster testing workflow
- ⚠️ Less secure, only use for development

### How to Change Setting

1. **In Supabase Dashboard**
   - Go to **Settings** (gear icon) → **Authentication**

2. **Find "Email Verification Section"**
   - Look for toggle or checkbox

3. **Toggle As Needed**
   - OFF (disabled): Users sign up and immediately access app
   - ON (enabled): Users must confirm email first

4. **Click Save**
   - Changes take effect immediately

---

## 🔗 Redirect URLs Configuration

### Why It Matters
- Tells Supabase where to send users after email confirmation
- Must match your app's actual domain
- Required for email link verification to work

### How to Set Redirect URLs

1. **Navigate to Settings**
   - Dashboard → **Settings** (gear icon)
   - Left sidebar → **Authentication**

2. **Find "Redirect URLs" Section**
   - You should see a text field with comma-separated URLs

3. **For Development (localhost)**
   - Add: `http://localhost:3002/auth/sign-up-success`
   - Add: `http://localhost:3002/dashboard`

4. **For Production**
   - Replace with your production domain:
   - `https://yourdomain.com/auth/sign-up-success`
   - `https://yourdomain.com/dashboard`

5. **Format**
   ```
   http://localhost:3002/auth/sign-up-success,
   http://localhost:3002/dashboard,
   https://yourdomain.com/auth/sign-up-success,
   https://yourdomain.com/dashboard
   ```

6. **Save Changes**

---

## 🔐 API Keys & Credentials

### Location
**Settings → API → Keys**

### Your Credentials
```
Project URL:     https://qakxonpsgpaeamppkoki.supabase.co ← Copy this
Anon Public Key: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9... ← Copy this
Service Role Key: (Don't use in frontend - only for backend)
```

### Where to Use
- **Public URL** → Goes in `NEXT_PUBLIC_SUPABASE_URL`
- **Anon Key** → Goes in `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- **Service Key** → Use only in `.env` (not `.env.local`), server-only

### How to Copy

1. **In Supabase Dashboard**
   - Go to **Settings** → **API**

2. **Find Keys Section**
   - **Project URL** - click copy icon
   - **Anon Public Key** - click copy icon

3. **Paste into `.env.local`**
   ```
   NEXT_PUBLIC_SUPABASE_URL=https://qakxonpsgpaeamppkoki.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
   ```

4. **Restart Dev Server**
   ```bash
   npm run dev
   ```

---

## 📊 Monitoring & Logs

### View Authentication Logs

1. **In Supabase Dashboard**
   - Go to **Settings** → **Logs**

2. **Filter by Authentication**
   - Select "auth" from dropdown

3. **View Recent Events**
   - User signups
   - Login attempts
   - Password resets
   - Email confirmations

### Example Logs
```
[2026-03-14 10:30:00] User signup: test@example.com → SUCCESS
[2026-03-14 10:30:15] User login: test@example.com → SUCCESS
[2026-03-14 10:30:45] User password reset request → SUCCESS
[2026-03-14 10:31:00] Email confirmation link sent → SUCCESS
```

### Troubleshooting with Logs
- Check if signup was actually created
- Verify login attempts are being recorded
- See actual error messages from failed attempts
- Monitor email delivery issues

---

## 🔄 Complete Reset Workflow

### Checklist for Full Authentication Reset

1. **Delete All Users**
   - [ ] Authentication → Users
   - [ ] Delete each user (click ⋮ → Delete)
   - [ ] Verify list is empty
   - [ ] Refresh page (F5)

2. **Configure Email Settings**
   - [ ] Settings → Authentication
   - [ ] Choose: Email verification ON/OFF
   - [ ] Save changes

3. **Verify Redirect URLs**
   - [ ] Settings → Authentication → Redirect URLs
   - [ ] Ensure localhost URLs are present
   - [ ] Format is correct (http://localhost:3002/...)
   - [ ] Save if changed

4. **Verify API Credentials**
   - [ ] Settings → API → Keys
   - [ ] Copy Project URL
   - [ ] Copy Anon Public Key
   - [ ] Verify in `.env.local`

5. **Restart Dev Server**
   - [ ] Terminal: Ctrl+C (stop current)
   - [ ] Run: `npm run dev`
   - [ ] Wait for: "Server running on http://localhost:3002"

6. **Clear Browser Cache**
   - [ ] Press: Ctrl+Shift+Delete
   - [ ] Select localhost:3002
   - [ ] Clear all data types
   - [ ] Close and reopen browser

7. **Test Signup**
   - [ ] Visit: http://localhost:3002/auth/sign-up
   - [ ] Create new test user
   - [ ] Check Supabase Users table
   - [ ] Verify user appears

8. **Test Login**
   - [ ] Visit: http://localhost:3002/auth/login
   - [ ] Login with credentials
   - [ ] Verify successful redirect

---

## 🆘 Common Issues & Solutions

### Issue: "This email is already registered"

**Solution:**
1. Go to Supabase Dashboard → Authentication → Users
2. Search for that email
3. Delete the user (click ⋮ → Delete user)
4. Try signup again

### Issue: User appears in dashboard but can't login

**Solution:**
1. Check email verification status
2. If verification is ON, user needs to confirm email
3. Check redirect URLs are correct
4. Try disabling email verification temporarily for testing

### Issue: Email link doesn't work

**Solution:**
1. Check redirect URLs in Settings
2. Ensure URL format is correct: `http://localhost:3002/auth/sign-up-success`
3. Don't include trailing slashes
4. Check for typos

### Issue: Signup redirects to wrong page

**Solution:**
1. Check email verification setting matches expected behavior
2. Verify redirect URL in signup code: `emailRedirectTo`
3. Check `.env` variables are correct
4. Restart dev server after `.env` changes

---

## 📝 Step-by-Step Video Walkthrough

If you prefer visual instructions, follow these steps in order:

### Reset Complete Auth System (10 minutes)
1. **Delete Users** (2 min)
   - Supabase → Authentication → Users
   - Delete each user individually
   
2. **Configure Email** (2 min)
   - Settings → Authentication
   - Turn email verification ON/OFF

3. **Set Redirect URLs** (2 min)
   - Settings → Authentication → Redirect URLs
   - Add localhost and production URLs

4. **Restart Server** (2 min)
   - Ctrl+C to stop
   - `npm run dev` to restart
   - Wait for startup message

5. **Test Signup** (2 min)
   - http://localhost:3002/auth/sign-up
   - Create account
   - Verify in Supabase Users table

---

## 🎓 Security Best Practices

### For Development/Testing
- ✅ Disable email verification for faster testing
- ✅ Use test@example.com style emails
- ✅ Use simple test passwords
- ✅ Keep localhost URLs in redirect list

### For Production
- ✅ Enable email verification
- ✅ Set strong password requirements
- ✅ Remove localhost from redirect URLs
- ✅ Add your production domain only
- ✅ Enable 2FA/MFA
- ✅ Set rate limits on auth endpoints

---

**Last Updated:** March 14, 2026
