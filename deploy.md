# 🚀 Vercel + Supabase Deployment Guide

Follow these steps exactly to deploy the Resume Builder SaaS securely to Vercel with Supabase and Razorpay connected.

---

## 1. 🗄️ SUPABASE SETUP

1. Go to [Supabase](https://supabase.com/) and create a new project.
2. Go to **SQL Editor** in the Supabase Dashboard.
3. Paste and run the entire SQL script from `SAAS_ARCHITECTURE.md` (Section 2) to create tables, triggers, and RLS policies.
4. Go to **Authentication > Providers** and enable:
   - Email (disable email confirmations if you want instant login during testing).
   - Google (set up OAuth credentials in Google Cloud Console).
5. Go to **Project Settings > API**.
   - Copy the `Project URL` and `anon public` key.
   - Copy the `service_role secret` (KEEP THIS SECRET).

---

## 2. 💳 RAZORPAY SETUP

1. Go to the [Razorpay Dashboard](https://dashboard.razorpay.com/).
2. Navigate to **Settings > API Keys**.
3. Generate new keys in **Live** or **Test** mode.
   - Copy the `Key Id` and `Key Secret`.

---

## 3. 🔐 ENVIRONMENT VARIABLES CONFIGURATION

Create a `.env.local` file for local development. **You must add these EXACT variables to your Vercel project settings later.**

```env
# ---------------------------------------------
# SUPABASE CONFIG
# ---------------------------------------------
NEXT_PUBLIC_SUPABASE_URL="https://your-project-id.supabase.co"
NEXT_PUBLIC_SUPABASE_ANON_KEY="your-anon-key"
SUPABASE_SERVICE_ROLE_KEY="your-service-role-key"

# ---------------------------------------------
# RAZORPAY CONFIG
# ---------------------------------------------
NEXT_PUBLIC_RAZORPAY_KEY_ID="rzp_test_YourKeyId"
RAZORPAY_KEY_SECRET="your_razorpay_secret"

# ---------------------------------------------
# AI PROVIDERS (ROTATION KEYS)
# ---------------------------------------------
# Primary: Gemini
GEMINI_API_KEY_1="AIzaSyYourGeminiKey1..."
GEMINI_API_KEY_2="AIzaSyYourGeminiKey2..."
GEMINI_API_KEY_3="AIzaSyYourGeminiKey3..."

# Fallback: OpenAI
OPENAI_API_KEY_1="sk-proj-YourOpenAIKey1..."
OPENAI_API_KEY_2="sk-proj-YourOpenAIKey2..."

# ---------------------------------------------
# APP CONFIG
# ---------------------------------------------
NEXT_PUBLIC_APP_URL="https://your-vercel-domain.vercel.app"
```

---

## 4. 🚀 VERCEL DEPLOYMENT

1. Push your Next.js codebase to GitHub.
2. Go to [Vercel](https://vercel.com/) and click **Add New > Project**.
3. Import your GitHub repository.
4. **IMPORTANT: Environment Variables Setup**
   - In the "Configure Project" screen, expand the **Environment Variables** section.
   - Add **every single variable** listed in step 3 above. 
   - Ensure `NEXT_PUBLIC_` prefixed variables are exposed to the browser.
   - Ensure backend secrets (like `SUPABASE_SERVICE_ROLE_KEY`, `RAZORPAY_KEY_SECRET`, and `GEMINI_API_KEY_1`) are hidden.
5. Click **Deploy**.

---

## 5. 🛠️ POST-DEPLOYMENT CHECKS

1. **Test Authentication:** Create a test account. Check if it correctly appears in the Supabase `users` table.
2. **Test DB Triggers:** Change your name once, then try changing it again. The database should reject the second update with "Name modification is locked".
3. **Test Payments:** In Razorpay Test Mode, trigger a mock interview or resume download. Complete the test payment. Check the Supabase `payments` table to verify `status` is 'success' and `expires_at` is set to +24 hours.
4. **Test AI Rotation:** Provide an invalid `GEMINI_API_KEY_1` temporarily and ensure the system seamlessly falls back to `GEMINI_API_KEY_2` or `OPENAI_API_KEY_1`.
5. **Check DPDP Logs:** Make a request and verify a new row appears in `user_access_logs` with your IP and action type.

---

## 6. 🎉 GOING LIVE

Once testing is complete:
1. Swap Razorpay Test keys with **Live Keys** in Vercel.
2. Set your custom domain in Vercel.
3. Update `NEXT_PUBLIC_APP_URL` to your custom domain in Vercel Environment Variables.
4. Re-deploy.
