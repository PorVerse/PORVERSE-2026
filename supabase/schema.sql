-- ==========================================
-- PORVERSE V2 - SUPABASE DATABASE SCHEMA
-- Complete schema cu toate tabelele necesare
-- ==========================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ==========================================
-- 1. PROFILES TABLE
-- ==========================================
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT NOT NULL UNIQUE,
    full_name TEXT,
    avatar_url TEXT,
    subscription_tier TEXT NOT NULL DEFAULT 'free' CHECK (subscription_tier IN ('free', 'pro', 'elite')),
    subscription_status TEXT NOT NULL DEFAULT 'active' CHECK (subscription_status IN ('active', 'cancelled', 'past_due', 'trialing')),
    trial_ends_at TIMESTAMPTZ,
    preferred_language TEXT NOT NULL DEFAULT 'en',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- RLS Policies pentru profiles
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own profile"
    ON public.profiles FOR SELECT
    USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
    ON public.profiles FOR UPDATE
    USING (auth.uid() = id);

-- ==========================================
-- 2. PORTALS TABLE
-- ==========================================
CREATE TABLE IF NOT EXISTS public.portals (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    portal_code TEXT NOT NULL UNIQUE CHECK (portal_code IN ('p0', 'p1', 'p2', 'p3', 'p4', 'p5')),
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    icon TEXT NOT NULL,
    color_primary TEXT NOT NULL,
    color_secondary TEXT NOT NULL,
    order_index INTEGER NOT NULL,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- RLS pentru portals (read-only pentru toți)
ALTER TABLE public.portals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view portals"
    ON public.portals FOR SELECT
    TO authenticated
    USING (is_active = true);

-- ==========================================
-- 3. PORTAL STEPS TABLE
-- ==========================================
CREATE TABLE IF NOT EXISTS public.portal_steps (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    portal_id UUID NOT NULL REFERENCES public.portals(id) ON DELETE CASCADE,
    step_number INTEGER NOT NULL,
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    content JSONB NOT NULL,
    estimated_duration INTEGER NOT NULL, -- minutes
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(portal_id, step_number)
);

-- RLS pentru portal_steps
ALTER TABLE public.portal_steps ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view portal steps"
    ON public.portal_steps FOR SELECT
    TO authenticated
    USING (is_active = true);

-- ==========================================
-- 4. USER PORTAL PROGRESS TABLE
-- ==========================================
CREATE TABLE IF NOT EXISTS public.user_portal_progress (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    portal_id UUID NOT NULL REFERENCES public.portals(id) ON DELETE CASCADE,
    current_step INTEGER NOT NULL DEFAULT 1,
    total_steps INTEGER NOT NULL,
    completion_percentage INTEGER NOT NULL DEFAULT 0,
    status TEXT NOT NULL DEFAULT 'not_started' CHECK (status IN ('not_started', 'in_progress', 'completed')),
    started_at TIMESTAMPTZ,
    completed_at TIMESTAMPTZ,
    last_activity_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(user_id, portal_id)
);

-- RLS pentru user_portal_progress
ALTER TABLE public.user_portal_progress ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own progress"
    ON public.user_portal_progress FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own progress"
    ON public.user_portal_progress FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own progress"
    ON public.user_portal_progress FOR UPDATE
    USING (auth.uid() = user_id);

-- ==========================================
-- 5. AI CONVERSATIONS TABLE
-- ==========================================
CREATE TABLE IF NOT EXISTS public.ai_conversations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    portal_id UUID REFERENCES public.portals(id) ON DELETE SET NULL,
    title TEXT NOT NULL,
    ai_provider TEXT NOT NULL CHECK (ai_provider IN ('openai', 'anthropic')),
    model TEXT NOT NULL,
    conversation_type TEXT NOT NULL CHECK (conversation_type IN ('guidance', 'reflection', 'quantum')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- RLS pentru ai_conversations
ALTER TABLE public.ai_conversations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own conversations"
    ON public.ai_conversations FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can create own conversations"
    ON public.ai_conversations FOR INSERT
    WITH CHECK (auth.uid() = user_id);

-- ==========================================
-- 6. AI MESSAGES TABLE
-- ==========================================
CREATE TABLE IF NOT EXISTS public.ai_messages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    conversation_id UUID NOT NULL REFERENCES public.ai_conversations(id) ON DELETE CASCADE,
    role TEXT NOT NULL CHECK (role IN ('user', 'assistant', 'system')),
    content TEXT NOT NULL,
    token_count INTEGER,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- RLS pentru ai_messages
ALTER TABLE public.ai_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own messages"
    ON public.ai_messages FOR SELECT
    USING (
        conversation_id IN (
            SELECT id FROM public.ai_conversations WHERE user_id = auth.uid()
        )
    );

CREATE POLICY "Users can create messages"
    ON public.ai_messages FOR INSERT
    WITH CHECK (
        conversation_id IN (
            SELECT id FROM public.ai_conversations WHERE user_id = auth.uid()
        )
    );

-- ==========================================
-- 7. BIOMETRIC SCANS TABLE
-- ==========================================
CREATE TABLE IF NOT EXISTS public.biometric_scans (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    scan_type TEXT NOT NULL CHECK (scan_type IN ('face', 'voice', 'palm')),
    scan_data JSONB NOT NULL,
    analysis_results JSONB NOT NULL,
    confidence_score DECIMAL(3,2) NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- RLS pentru biometric_scans
ALTER TABLE public.biometric_scans ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own scans"
    ON public.biometric_scans FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can create own scans"
    ON public.biometric_scans FOR INSERT
    WITH CHECK (auth.uid() = user_id);

-- ==========================================
-- 8. QUANTUM MEMORIES TABLE
-- ==========================================
CREATE TABLE IF NOT EXISTS public.quantum_memories (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    memory_type TEXT NOT NULL CHECK (memory_type IN ('past', 'present', 'future')),
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    emotional_resonance INTEGER NOT NULL CHECK (emotional_resonance >= 1 AND emotional_resonance <= 10),
    quantum_signature TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- RLS pentru quantum_memories
ALTER TABLE public.quantum_memories ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own memories"
    ON public.quantum_memories FOR ALL
    USING (auth.uid() = user_id);

-- ==========================================
-- 9. PAYMENTS TABLE
-- ==========================================
CREATE TABLE IF NOT EXISTS public.payments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    amount DECIMAL(10,2) NOT NULL,
    currency TEXT NOT NULL DEFAULT 'USD',
    provider TEXT NOT NULL CHECK (provider IN ('stripe', 'paypal')),
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'failed', 'refunded')),
    subscription_tier TEXT NOT NULL CHECK (subscription_tier IN ('free', 'pro', 'elite')),
    provider_payment_id TEXT,
    metadata JSONB,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- RLS pentru payments
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own payments"
    ON public.payments FOR SELECT
    USING (auth.uid() = user_id);

-- ==========================================
-- 10. OFFLINE QUEUE TABLE
-- ==========================================
CREATE TABLE IF NOT EXISTS public.offline_queue (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    action_type TEXT NOT NULL,
    payload JSONB NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'synced', 'failed')),
    retry_count INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    synced_at TIMESTAMPTZ
);

-- RLS pentru offline_queue
ALTER TABLE public.offline_queue ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own queue"
    ON public.offline_queue FOR ALL
    USING (auth.uid() = user_id);

-- ==========================================
-- FUNCTIONS & TRIGGERS
-- ==========================================

-- Function pentru updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers pentru updated_at
CREATE TRIGGER update_profiles_updated_at
    BEFORE UPDATE ON public.profiles
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_portals_updated_at
    BEFORE UPDATE ON public.portals
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_portal_steps_updated_at
    BEFORE UPDATE ON public.portal_steps
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_portal_progress_updated_at
    BEFORE UPDATE ON public.user_portal_progress
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function pentru auto-create profile
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $
BEGIN
    INSERT INTO public.profiles (id, email, full_name)
    VALUES (
        NEW.id,
        NEW.email,
        NEW.raw_user_meta_data->>'full_name'
    );
    RETURN NEW;
END;
$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger pentru auto-create profile
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ==========================================
-- INDEXES pentru Performance
-- ==========================================

-- Profiles
CREATE INDEX idx_profiles_email ON public.profiles(email);
CREATE INDEX idx_profiles_subscription_tier ON public.profiles(subscription_tier);

-- Portals
CREATE INDEX idx_portals_portal_code ON public.portals(portal_code);
CREATE INDEX idx_portals_order_index ON public.portals(order_index);

-- Portal Steps
CREATE INDEX idx_portal_steps_portal_id ON public.portal_steps(portal_id);
CREATE INDEX idx_portal_steps_step_number ON public.portal_steps(step_number);

-- User Portal Progress
CREATE INDEX idx_user_progress_user_id ON public.user_portal_progress(user_id);
CREATE INDEX idx_user_progress_portal_id ON public.user_portal_progress(portal_id);
CREATE INDEX idx_user_progress_status ON public.user_portal_progress(status);

-- AI Conversations
CREATE INDEX idx_ai_conversations_user_id ON public.ai_conversations(user_id);
CREATE INDEX idx_ai_conversations_portal_id ON public.ai_conversations(portal_id);

-- AI Messages
CREATE INDEX idx_ai_messages_conversation_id ON public.ai_messages(conversation_id);
CREATE INDEX idx_ai_messages_created_at ON public.ai_messages(created_at);

-- Biometric Scans
CREATE INDEX idx_biometric_scans_user_id ON public.biometric_scans(user_id);
CREATE INDEX idx_biometric_scans_scan_type ON public.biometric_scans(scan_type);

-- Quantum Memories
CREATE INDEX idx_quantum_memories_user_id ON public.quantum_memories(user_id);
CREATE INDEX idx_quantum_memories_memory_type ON public.quantum_memories(memory_type);

-- Payments
CREATE INDEX idx_payments_user_id ON public.payments(user_id);
CREATE INDEX idx_payments_status ON public.payments(status);

-- Offline Queue
CREATE INDEX idx_offline_queue_user_id ON public.offline_queue(user_id);
CREATE INDEX idx_offline_queue_status ON public.offline_queue(status);

-- ==========================================
-- COMENTARII
-- ==========================================

COMMENT ON TABLE public.profiles IS 'User profiles with subscription information';
COMMENT ON TABLE public.portals IS 'The 6 main portals (P0-P5)';
COMMENT ON TABLE public.portal_steps IS 'Steps within each portal';
COMMENT ON TABLE public.user_portal_progress IS 'User progress through each portal';
COMMENT ON TABLE public.ai_conversations IS 'AI guidance conversations';
COMMENT ON TABLE public.ai_messages IS 'Individual messages in conversations';
COMMENT ON TABLE public.biometric_scans IS 'Face/voice/palm biometric data';
COMMENT ON TABLE public.quantum_memories IS 'Past/present/future memories';
COMMENT ON TABLE public.payments IS 'Payment transactions';
COMMENT ON TABLE public.offline_queue IS 'Offline sync queue';