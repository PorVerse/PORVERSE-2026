-- ==========================================
-- PORVERSE V2 - ACHIEVEMENT SYSTEM TABLES
-- Migration: Add Achievement Tracking
-- ==========================================
-- Version: 1.0.0
-- Created: 2025-11-02
-- Description: Adds achievement system for gamification

-- ==========================================
-- 1. ACHIEVEMENTS TABLE
-- ==========================================
-- Stores achievement definitions
CREATE TABLE IF NOT EXISTS public.achievements (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    
    -- Basic Info
    code TEXT NOT NULL UNIQUE,
    name TEXT NOT NULL,
    description TEXT NOT NULL,
    
    -- Categorization
    category TEXT NOT NULL CHECK (category IN (
        'completion',    -- Portal completion achievements
        'streak',        -- Streak-based achievements
        'quality',       -- Quality score achievements
        'speed',         -- Time-based achievements
        'mastery',       -- Master level achievements
        'exploration',   -- Discovery achievements
        'social'         -- Social interaction achievements
    )),
    
    -- Visual
    icon TEXT NOT NULL,
    color TEXT DEFAULT '#8b5cf6',
    
    -- Points & Rarity
    points INTEGER NOT NULL DEFAULT 0 CHECK (points >= 0),
    rarity TEXT NOT NULL DEFAULT 'common' CHECK (rarity IN (
        'common',
        'rare',
        'epic',
        'legendary'
    )),
    
    -- Unlock Criteria (JSONB for flexibility)
    unlock_criteria JSONB NOT NULL,
    -- Example: {"steps_completed": 1}
    -- Example: {"portals_completed": 6}
    -- Example: {"streak_days": 7}
    -- Example: {"quality_score": 90}
    
    -- Status
    is_active BOOLEAN NOT NULL DEFAULT true,
    is_hidden BOOLEAN NOT NULL DEFAULT false, -- Secret achievements
    
    -- Order
    display_order INTEGER DEFAULT 0,
    
    -- Metadata
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ==========================================
-- 2. USER ACHIEVEMENTS TABLE
-- ==========================================
-- Tracks user progress on achievements
CREATE TABLE IF NOT EXISTS public.user_achievements (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    
    -- References
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    achievement_id UUID NOT NULL REFERENCES public.achievements(id) ON DELETE CASCADE,
    
    -- Progress
    progress_percentage INTEGER NOT NULL DEFAULT 0 CHECK (
        progress_percentage >= 0 AND progress_percentage <= 100
    ),
    is_completed BOOLEAN NOT NULL DEFAULT false,
    
    -- Timestamps
    unlocked_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    completed_at TIMESTAMPTZ,
    notified_at TIMESTAMPTZ, -- When user was notified
    
    -- Progress Data (JSONB for tracking intermediate progress)
    progress_data JSONB,
    -- Example: {"current_steps": 5, "target_steps": 10}
    -- Example: {"current_streak": 3, "target_streak": 7}
    
    -- Metadata
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    
    -- Constraints
    UNIQUE(user_id, achievement_id)
);

-- ==========================================
-- 3. INDEXES FOR PERFORMANCE
-- ==========================================

-- Achievements indexes
CREATE INDEX idx_achievements_category ON public.achievements(category);
CREATE INDEX idx_achievements_rarity ON public.achievements(rarity);
CREATE INDEX idx_achievements_is_active ON public.achievements(is_active);
CREATE INDEX idx_achievements_display_order ON public.achievements(display_order);

-- User achievements indexes
CREATE INDEX idx_user_achievements_user_id ON public.user_achievements(user_id);
CREATE INDEX idx_user_achievements_achievement_id ON public.user_achievements(achievement_id);
CREATE INDEX idx_user_achievements_is_completed ON public.user_achievements(is_completed);
CREATE INDEX idx_user_achievements_completed_at ON public.user_achievements(completed_at);

-- Composite indexes for common queries
CREATE INDEX idx_user_achievements_user_completed ON public.user_achievements(user_id, is_completed);
CREATE INDEX idx_achievements_active_category ON public.achievements(is_active, category);

-- ==========================================
-- 4. ROW LEVEL SECURITY (RLS)
-- ==========================================

-- Enable RLS
ALTER TABLE public.achievements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_achievements ENABLE ROW LEVEL SECURITY;

-- Achievements: Anyone can view active achievements
CREATE POLICY "Anyone can view active achievements"
    ON public.achievements FOR SELECT
    TO authenticated
    USING (is_active = true);

-- User Achievements: Users can view their own achievements
CREATE POLICY "Users can view own achievements"
    ON public.user_achievements FOR SELECT
    USING (auth.uid() = user_id);

-- User Achievements: Users can insert their own achievements
CREATE POLICY "Users can insert own achievements"
    ON public.user_achievements FOR INSERT
    WITH CHECK (auth.uid() = user_id);

-- User Achievements: Users can update their own achievements
CREATE POLICY "Users can update own achievements"
    ON public.user_achievements FOR UPDATE
    USING (auth.uid() = user_id);

-- ==========================================
-- 5. TRIGGERS FOR UPDATED_AT
-- ==========================================

-- Trigger for achievements
CREATE TRIGGER update_achievements_updated_at
    BEFORE UPDATE ON public.achievements
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Trigger for user_achievements
CREATE TRIGGER update_user_achievements_updated_at
    BEFORE UPDATE ON public.user_achievements
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ==========================================
-- 6. HELPFUL FUNCTIONS
-- ==========================================

/**
 * Function to automatically set completed_at when achievement is completed
 */
CREATE OR REPLACE FUNCTION set_achievement_completed_at()
RETURNS TRIGGER AS $$
BEGIN
    -- If achievement is being marked as completed and completed_at is null
    IF NEW.is_completed = true AND NEW.completed_at IS NULL THEN
        NEW.completed_at = NOW();
        NEW.progress_percentage = 100;
    END IF;
    
    -- If achievement is being uncompleted
    IF NEW.is_completed = false AND OLD.is_completed = true THEN
        NEW.completed_at = NULL;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for auto-setting completed_at
CREATE TRIGGER trigger_set_achievement_completed_at
    BEFORE INSERT OR UPDATE ON public.user_achievements
    FOR EACH ROW
    EXECUTE FUNCTION set_achievement_completed_at();

/**
 * Function to get user's total achievement points
 */
CREATE OR REPLACE FUNCTION get_user_achievement_points(p_user_id UUID)
RETURNS INTEGER AS $$
    SELECT COALESCE(SUM(a.points), 0)::INTEGER
    FROM public.user_achievements ua
    JOIN public.achievements a ON ua.achievement_id = a.id
    WHERE ua.user_id = p_user_id
    AND ua.is_completed = true;
$$ LANGUAGE sql STABLE;

/**
 * Function to get user's achievement completion percentage
 */
CREATE OR REPLACE FUNCTION get_user_achievement_completion(p_user_id UUID)
RETURNS NUMERIC AS $$
    SELECT 
        CASE 
            WHEN COUNT(*) = 0 THEN 0
            ELSE ROUND((COUNT(*) FILTER (WHERE ua.is_completed = true)::NUMERIC / COUNT(*)::NUMERIC) * 100, 2)
        END
    FROM public.achievements a
    LEFT JOIN public.user_achievements ua ON a.id = ua.achievement_id AND ua.user_id = p_user_id
    WHERE a.is_active = true;
$$ LANGUAGE sql STABLE;

-- ==========================================
-- 7. COMMENTS FOR DOCUMENTATION
-- ==========================================

COMMENT ON TABLE public.achievements IS 'Achievement definitions for gamification system';
COMMENT ON TABLE public.user_achievements IS 'User progress and completion status for achievements';

COMMENT ON COLUMN public.achievements.code IS 'Unique code identifier for achievement (e.g., "first_step")';
COMMENT ON COLUMN public.achievements.unlock_criteria IS 'JSON criteria for unlocking achievement';
COMMENT ON COLUMN public.achievements.is_hidden IS 'Secret achievements not shown until unlocked';

COMMENT ON COLUMN public.user_achievements.progress_percentage IS 'Progress towards achievement completion (0-100)';
COMMENT ON COLUMN public.user_achievements.notified_at IS 'When user was notified of achievement unlock';
COMMENT ON COLUMN public.user_achievements.progress_data IS 'Detailed progress tracking data';

COMMENT ON FUNCTION get_user_achievement_points(UUID) IS 'Calculate total achievement points for a user';
COMMENT ON FUNCTION get_user_achievement_completion(UUID) IS 'Calculate achievement completion percentage for a user';

-- ==========================================
-- MIGRATION COMPLETE
-- ==========================================

-- Verify tables were created
DO $$
BEGIN
    IF EXISTS (
        SELECT FROM pg_tables 
        WHERE schemaname = 'public' 
        AND tablename IN ('achievements', 'user_achievements')
    ) THEN
        RAISE NOTICE '✅ Achievement tables created successfully';
    ELSE
        RAISE EXCEPTION '❌ Failed to create achievement tables';
    END IF;
END $$;