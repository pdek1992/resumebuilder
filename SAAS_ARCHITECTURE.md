# 🚀 AI Resume Builder SaaS - Architecture & Implementation Blueprint

This document outlines the complete system architecture, database schema, API routes, and integrations required to build the production-grade SaaS Resume Builder.

---

## 1. 🏗️ FULL SYSTEM ARCHITECTURE

**Tech Stack:**
*   **Framework:** Next.js 14+ (App Router, Server Actions)
*   **Database & Auth:** Supabase (PostgreSQL, Supabase Auth)
*   **Payments:** Razorpay
*   **AI Engine:** Google Gemini (Primary) + OpenAI (Fallback) via Vercel AI SDK
*   **Hosting:** Vercel
*   **PDF Generation:** `puppeteer-core` with `@sparticuz/chromium` (Serverless compatible) OR `react-pdf` for pure frontend/serverless hybrid.

**Core Principles:**
1.  **Zero Client Trust:** All sensitive operations (AI generation, payment verification, data fetching) happen on the Vercel server (Server Components / Route Handlers).
2.  **DPDP Compliance:** Consent is recorded permanently. Users can delete their data entirely.
3.  **Strict Payment Gate:** Downloads and mock interviews are restricted via server-side checks. No frontend flags can bypass this.
4.  **Logging & Analytics:** Every critical action is recorded in `user_access_logs`.

---

## 2. 🗄️ SUPABASE SQL SCHEMA (MANDATORY)

Execute this in the Supabase SQL Editor.

```sql
-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. users
CREATE TABLE users (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT UNIQUE NOT NULL,
    mobile TEXT UNIQUE,
    full_name TEXT,
    first_name TEXT,
    last_name TEXT,
    auth_provider TEXT NOT NULL,
    consent_given BOOLEAN DEFAULT FALSE,
    consent_timestamp TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    last_login TIMESTAMPTZ DEFAULT NOW()
);

-- Trigger to lock full_name after first save
CREATE OR REPLACE FUNCTION lock_name_update()
RETURNS TRIGGER AS $$
BEGIN
    IF OLD.full_name IS NOT NULL AND NEW.full_name <> OLD.full_name THEN
        RAISE EXCEPTION 'Name modification is locked. Contact support.';
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER prevent_name_change
BEFORE UPDATE ON users
FOR EACH ROW EXECUTE FUNCTION lock_name_update();

-- 2. resumes
CREATE TABLE resumes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
    title TEXT NOT NULL,
    template_id TEXT NOT NULL,
    raw_json JSONB DEFAULT '{}'::jsonb,
    parsed_sections JSONB DEFAULT '{}'::jsonb,
    last_updated TIMESTAMPTZ DEFAULT NOW()
);

-- 3. resume_versions
CREATE TABLE resume_versions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    resume_id UUID REFERENCES resumes(id) ON DELETE CASCADE NOT NULL,
    version_data JSONB NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. payments
CREATE TABLE payments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
    razorpay_order_id TEXT NOT NULL,
    razorpay_payment_id TEXT,
    razorpay_signature TEXT,
    amount DECIMAL NOT NULL,
    method TEXT,
    status TEXT DEFAULT 'pending', -- pending, success, failed
    feature_unlocked TEXT NOT NULL, -- 'resume_24h' or 'mock_interview'
    created_at TIMESTAMPTZ DEFAULT NOW(),
    expires_at TIMESTAMPTZ
);

-- 5. cover_letters
CREATE TABLE cover_letters (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
    resume_id UUID REFERENCES resumes(id) ON DELETE CASCADE NOT NULL,
    job_description TEXT NOT NULL,
    generated_text TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. mock_interviews
CREATE TABLE mock_interviews (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
    resume_id UUID REFERENCES resumes(id) ON DELETE CASCADE NOT NULL,
    qa_data JSONB NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 7. support_requests
CREATE TABLE support_requests (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
    type TEXT NOT NULL,
    message TEXT NOT NULL,
    resolved_status BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 8. user_access_logs (DPDP & Audit)
CREATE TABLE user_access_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
    action_type TEXT NOT NULL,
    ip_address TEXT,
    user_agent TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 9. user_last_activity (Fast Lookup)
CREATE TABLE user_last_activity (
    user_id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
    last_accessed_at TIMESTAMPTZ DEFAULT NOW()
);

-- Row Level Security (RLS)
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE resumes ENABLE ROW LEVEL SECURITY;
ALTER TABLE resume_versions ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE cover_letters ENABLE ROW LEVEL SECURITY;
ALTER TABLE mock_interviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE support_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_access_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_last_activity ENABLE ROW LEVEL SECURITY;

-- Create policies (Users can only access their own data)
CREATE POLICY "Users can view own data" ON users FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own data" ON users FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Users can view own resumes" ON resumes FOR ALL USING (auth.uid() = user_id);
-- (Repeat for other tables ensuring auth.uid() = user_id)
```

---

## 3. 🌐 API ROUTES (Next.js App Router)

All endpoints reside in `app/api/...`

*   `POST /api/auth/webhook`: Supabase Auth Webhook. Automatically creates a record in `users` when a user signs up.
*   `POST /api/consent`: Records DPDP consent. Logs to `user_access_logs`.
*   `GET /api/resume`: Fetches user resumes. Updates `last_accessed_at`.
*   `POST /api/resume/save`: Auto-saves resume JSON. Creates a version in `resume_versions` if significant changes are detected.
*   `POST /api/payments/create-order`: Generates Razorpay Order ID securely on the server.
*   `POST /api/payments/verify`: Verifies Razorpay signature using `crypto`. Updates payment status to `success` and sets `expires_at` (NOW() + 24 hours).
*   `GET /api/downloads/resume`: Checks if user has an active payment (`expires_at > NOW()`). If yes, generates/returns PDF. If no, returns 403.
*   `POST /api/ai/generate`: AI completion endpoint (uses rotation logic).
*   `DELETE /api/users/delete`: Triggers full account deletion complying with DPDP.

---

## 4. 🎨 UI COMPONENTS

*   `ConsentModal`: Renders on root layout if `user.consent_given == false`. Cannot be closed without accepting.
*   `ResumeEditor`: Minimal, distraction-free forms (Personal, Experience, Education, Skills). Auto-saves `onChange` (debounced 1000ms).
*   `TemplateSelector`: Lazy-loaded grid of template thumbnails.
*   `PDFViewer`: Server-side rendered preview using standard web fonts.
*   `PaywallModal`: Triggered when hitting "Download" or "Mock Interview". Shows Razorpay checkout.

---

## 5. 💳 RAZORPAY INTEGRATION

**Frontend Flow:**
```javascript
// Triggered on 'Download' click
const handlePayment = async () => {
    const { orderId, amount } = await fetch('/api/payments/create-order').then(r => r.json());
    
    const options = {
        key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
        amount: amount,
        currency: "INR",
        name: "Resume Builder SaaS",
        description: "24-Hour Resume Access",
        order_id: orderId,
        handler: async function (response) {
            const verify = await fetch('/api/payments/verify', {
                method: 'POST',
                body: JSON.stringify(response)
            });
            if(verify.ok) { unlockDownload(); }
        },
        prefill: { email: user.email, contact: user.mobile }
    };
    const rzp = new window.Razorpay(options);
    rzp.open();
};
```

**Backend Signature Verification (`app/api/payments/verify/route.ts`):**
```javascript
import crypto from 'crypto';

const generatedSignature = crypto
  .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
  .update(orderCreationId + "|" + razorpayPaymentId)
  .digest('hex');

if (generatedSignature === razorpaySignature) {
    // Payment legit. Update DB with expires_at = NOW() + 24 INTERVAL
}
```

---

## 6. 🧠 AI INTEGRATION (Fallback & Strict Formatting)

```javascript
// lib/ai.ts
import { GoogleGenerativeAI } from '@google/generative-ai';
import OpenAI from 'openai';

const geminiKeys = [
  process.env.GEMINI_API_KEY_1, 
  process.env.GEMINI_API_KEY_2,
  process.env.GEMINI_API_KEY_3
].filter(Boolean);

const openaiKeys = [
  process.env.OPENAI_API_KEY_1, 
  process.env.OPENAI_API_KEY_2
].filter(Boolean);

export async function generateContent(prompt) {
  let attempt = 0;
  
  // Strict System Prompt to prevent chatty output
  const systemPrompt = `You are an expert resume writer. Return ONLY the requested content. No introductory phrases, no "Here is your answer", no suggestions, no markdown wrappers unless explicitly requested.`;

  // Try Gemini first
  while(attempt < geminiKeys.length) {
    try {
      const genAI = new GoogleGenerativeAI(geminiKeys[attempt]);
      const model = genAI.getGenerativeModel({ model: "gemini-1.5-pro", systemInstruction: systemPrompt });
      const result = await model.generateContent(prompt);
      return result.response.text();
    } catch (e) { attempt++; }
  }

  attempt = 0;
  // Fallback to OpenAI
  while(attempt < openaiKeys.length) {
    try {
      const openai = new OpenAI({ apiKey: openaiKeys[attempt] });
      const response = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [{role: "system", content: systemPrompt}, {role: "user", content: prompt}],
      });
      return response.choices[0].message.content;
    } catch (e) { attempt++; }
  }
  throw new Error("All AI providers failed. Check quotas.");
}
```

---

## 7. 📊 ACCESS LOGGING SYSTEM

Create a middleware or reusable utility to log actions securely.

```javascript
// lib/logger.ts
import { supabaseAdmin } from './supabase';
import { headers } from 'next/headers';

export async function logAction(userId: string, actionType: string) {
    const headersList = headers();
    const ip = headersList.get('x-forwarded-for') || 'unknown';
    const userAgent = headersList.get('user-agent') || 'unknown';

    // 1. Insert into Access Logs
    await supabaseAdmin.from('user_access_logs').insert({
        user_id: userId,
        action_type: actionType,
        ip_address: ip,
        user_agent: userAgent
    });

    // 2. Update Fast Lookup Table
    await supabaseAdmin.from('user_last_activity')
        .upsert({ user_id: userId, last_accessed_at: new Date().toISOString() });
}
```
