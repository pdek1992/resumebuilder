-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- USERS (Extending Supabase Auth)
-- Note: Supabase auth.users is handled automatically. We create a public profile table linked to it.
CREATE TABLE public.profiles (
    id UUID REFERENCES auth.users(id) PRIMARY KEY,
    email TEXT UNIQUE NOT NULL,
    mobile TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- RESUMES
CREATE TABLE public.resumes (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES public.profiles(id) NOT NULL,
    content JSONB NOT NULL DEFAULT '{}'::jsonb,
    is_paid BOOLEAN DEFAULT FALSE,
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- PAYMENTS
CREATE TABLE public.payments (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES public.profiles(id) NOT NULL,
    resume_id UUID REFERENCES public.resumes(id),
    razorpay_order_id TEXT UNIQUE NOT NULL,
    razorpay_payment_id TEXT UNIQUE,
    amount INTEGER NOT NULL, -- in paise
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'paid', 'failed')),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- DOWNLOAD LOGS (For abuse tracking)
CREATE TABLE public.downloads (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES public.profiles(id) NOT NULL,
    resume_id UUID REFERENCES public.resumes(id) NOT NULL,
    downloaded_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS POLICIES (Security)
ALTER TABLE public.resumes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage their own resumes" ON public.resumes
    FOR ALL USING (auth.uid() = user_id);

-- Vercel backend using SERVICE_ROLE key will bypass RLS to update payments and handle server-to-server operations.
