-- ==========================================
-- PORVERSE V2 - ACHIEVEMENT SEED DATA
-- Seed: Initial Achievement Definitions
-- ==========================================
-- Version: 1.0.0
-- Created: 2025-11-02
-- Description: Seeds the achievement system with initial achievements

-- ==========================================
-- COMPLETION ACHIEVEMENTS
-- ==========================================

INSERT INTO public.achievements (code, name, description, category, icon, color, points, rarity, unlock_criteria, display_order) VALUES
(
    'first_step',
    'First Step',
    'Complete your first portal step. Every journey begins with a single step.',
    'completion',
    '👣',
    '#10B981',
    10,
    'common',
    '{"steps_completed": 1}',
    1
),
(
    'portal_explorer',
    'Portal Explorer',
    'Start your first portal. Welcome to the journey of self-discovery.',
    'completion',
    '🚪',
    '#3B82F6',
    25,
    'common',
    '{"portals_started": 1}',
    2
),
(
    'portal_master',
    'Portal Master',
    'Complete an entire portal from start to finish.',
    'completion',
    '🎯',
    '#8B5CF6',
    100,
    'rare',
    '{"portals_completed": 1}',
    3
),
(
    'three_portals',
    'Triple Threat',
    'Complete three different portals. You''re on a roll!',
    'completion',
    '⚡',
    '#F59E0B',
    250,
    'rare',
    '{"portals_completed": 3}',
    4
),
(
    'all_portals',
    'Enlightened One',
    'Complete all 6 portals. You have achieved mastery.',
    'completion',
    '🌟',
    '#EC4899',
    500,
    'legendary',
    '{"portals_completed": 6}',
    5
);

-- ==========================================
-- STREAK ACHIEVEMENTS
-- ==========================================

INSERT INTO public.achievements (code, name, description, category, icon, color, points, rarity, unlock_criteria, display_order) VALUES
(
    'streak_3',
    'Consistency Starter',
    'Maintain a 3-day streak. Building habits takes time.',
    'streak',
    '🔥',
    '#EF4444',
    30,
    'common',
    '{"streak_days": 3}',
    10
),
(
    'streak_week',
    'Week Warrior',
    'Maintain a 7-day streak. One week of dedication!',
    'streak',
    '🔥🔥',
    '#F97316',
    50,
    'rare',
    '{"streak_days": 7}',
    11
),
(
    'streak_month',
    'Monthly Master',
    'Maintain a 30-day streak. Incredible commitment!',
    'streak',
    '🔥🔥🔥',
    '#FBBF24',
    200,
    'epic',
    '{"streak_days": 30}',
    12
),
(
    'streak_hundred',
    'Centurion',
    'Maintain a 100-day streak. You are unstoppable!',
    'streak',
    '🔥🔥🔥🔥',
    '#DC2626',
    500,
    'legendary',
    '{"streak_days": 100}',
    13
);

-- ==========================================
-- QUALITY ACHIEVEMENTS
-- ==========================================

INSERT INTO public.achievements (code, name, description, category, icon, color, points, rarity, unlock_criteria, display_order) VALUES
(
    'quality_seeker',
    'Quality Seeker',
    'Achieve 90%+ quality score on a portal step.',
    'quality',
    '💎',
    '#06B6D4',
    75,
    'rare',
    '{"quality_score_min": 90}',
    20
),
(
    'perfectionist',
    'Perfectionist',
    'Achieve 100% quality score on a portal step.',
    'quality',
    '💯',
    '#8B5CF6',
    150,
    'epic',
    '{"quality_score_min": 100}',
    21
),
(
    'consistent_quality',
    'Consistent Excellence',
    'Maintain 90%+ average quality across 5 portal completions.',
    'quality',
    '⭐',
    '#F59E0B',
    300,
    'epic',
    '{"portals_completed": 5, "average_quality_score": 90}',
    22
);

-- ==========================================
-- SPEED ACHIEVEMENTS
-- ==========================================

INSERT INTO public.achievements (code, name, description, category, icon, color, points, rarity, unlock_criteria, display_order) VALUES
(
    'speed_demon',
    'Speed Demon',
    'Complete a portal in under 2 hours.',
    'speed',
    '⚡',
    '#EF4444',
    50,
    'rare',
    '{"portal_completion_time_max": 120}',
    30
),
(
    'efficiency_expert',
    'Efficiency Expert',
    'Complete a portal in under 1 hour.',
    'speed',
    '🚀',
    '#F97316',
    100,
    'epic',
    '{"portal_completion_time_max": 60}',
    31
),
(
    'lightning_fast',
    'Lightning Fast',
    'Complete a portal in under 30 minutes.',
    'speed',
    '⚡⚡',
    '#FBBF24',
    200,
    'legendary',
    '{"portal_completion_time_max": 30}',
    32
);

-- ==========================================
-- MASTERY ACHIEVEMENTS
-- ==========================================

INSERT INTO public.achievements (code, name, description, category, icon, color, points, rarity, unlock_criteria, display_order) VALUES
(
    'self_discoverer',
    'Self Discoverer',
    'Complete the Self Discovery portal (P0).',
    'mastery',
    '🔮',
    '#8B5CF6',
    100,
    'rare',
    '{"specific_portal": "p0"}',
    40
),
(
    'relationship_expert',
    'Relationship Expert',
    'Complete the Relationships portal (P1).',
    'mastery',
    '💝',
    '#EC4899',
    100,
    'rare',
    '{"specific_portal": "p1"}',
    41
),
(
    'career_navigator',
    'Career Navigator',
    'Complete the Career & Purpose portal (P2).',
    'mastery',
    '⭐',
    '#EAB308',
    100,
    'rare',
    '{"specific_portal": "p2"}',
    42
),
(
    'health_champion',
    'Health Champion',
    'Complete the Health & Vitality portal (P3).',
    'mastery',
    '🌱',
    '#22C55E',
    100,
    'rare',
    '{"specific_portal": "p3"}',
    43
),
(
    'wealth_builder',
    'Wealth Builder',
    'Complete the Financial Freedom portal (P4).',
    'mastery',
    '💰',
    '#3B82F6',
    100,
    'rare',
    '{"specific_portal": "p4"}',
    44
),
(
    'purpose_finder',
    'Purpose Finder',
    'Complete the Life Purpose portal (P5).',
    'mastery',
    '🎯',
    '#F97316',
    100,
    'rare',
    '{"specific_portal": "p5"}',
    45
);

-- ==========================================
-- EXPLORATION ACHIEVEMENTS
-- ==========================================

INSERT INTO public.achievements (code, name, description, category, icon, color, points, rarity, unlock_criteria, display_order) VALUES
(
    'early_bird',
    'Early Bird',
    'Complete a portal session before 8 AM.',
    'exploration',
    '🌅',
    '#F59E0B',
    25,
    'common',
    '{"session_time": "before_8am"}',
    50
),
(
    'night_owl',
    'Night Owl',
    'Complete a portal session after 10 PM.',
    'exploration',
    '🦉',
    '#8B5CF6',
    25,
    'common',
    '{"session_time": "after_10pm"}',
    51
),
(
    'weekend_warrior',
    'Weekend Warrior',
    'Complete 5 portal sessions on weekends.',
    'exploration',
    '🎊',
    '#EC4899',
    50,
    'rare',
    '{"weekend_sessions": 5}',
    52
),
(
    'data_collector',
    'Data Collector',
    'Complete your first biometric scan.',
    'exploration',
    '📊',
    '#06B6D4',
    30,
    'common',
    '{"biometric_scans": 1}',
    53
),
(
    'memory_keeper',
    'Memory Keeper',
    'Add your first quantum memory.',
    'exploration',
    '💭',
    '#7C3AED',
    30,
    'common',
    '{"quantum_memories": 1}',
    54
);

-- ==========================================
-- SECRET ACHIEVEMENTS (Hidden until unlocked)
-- ==========================================

INSERT INTO public.achievements (code, name, description, category, icon, color, points, rarity, unlock_criteria, is_hidden, display_order) VALUES
(
    'dedicated_learner',
    'Dedicated Learner',
    'Spend 10+ hours in total portal time.',
    'mastery',
    '📚',
    '#10B981',
    150,
    'epic',
    '{"total_time_minutes": 600}',
    true,
    60
),
(
    'midnight_explorer',
    'Midnight Explorer',
    'Complete a portal session exactly at midnight.',
    'exploration',
    '🌙',
    '#6366F1',
    100,
    'rare',
    '{"session_time": "exactly_midnight"}',
    true,
    61
),
(
    'comeback_kid',
    'Comeback Kid',
    'Restart a portal after a 30-day break.',
    'mastery',
    '🔄',
    '#EC4899',
    100,
    'rare',
    '{"break_days": 30, "restart": true}',
    true,
    62
),
(
    'overachiever',
    'Overachiever',
    'Complete all portals with 95%+ average quality.',
    'mastery',
    '🏆',
    '#FBBF24',
    1000,
    'legendary',
    '{"portals_completed": 6, "average_quality_score": 95}',
    true,
    63
);

-- ==========================================
-- VERIFICATION
-- ==========================================

-- Count achievements by category
DO $$
DECLARE
    total_count INTEGER;
    completion_count INTEGER;
    streak_count INTEGER;
    quality_count INTEGER;
    speed_count INTEGER;
    mastery_count INTEGER;
    exploration_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO total_count FROM public.achievements;
    SELECT COUNT(*) INTO completion_count FROM public.achievements WHERE category = 'completion';
    SELECT COUNT(*) INTO streak_count FROM public.achievements WHERE category = 'streak';
    SELECT COUNT(*) INTO quality_count FROM public.achievements WHERE category = 'quality';
    SELECT COUNT(*) INTO speed_count FROM public.achievements WHERE category = 'speed';
    SELECT COUNT(*) INTO mastery_count FROM public.achievements WHERE category = 'mastery';
    SELECT COUNT(*) INTO exploration_count FROM public.achievements WHERE category = 'exploration';
    
    RAISE NOTICE '✅ Achievement Seed Data Summary:';
    RAISE NOTICE '   Total Achievements: %', total_count;
    RAISE NOTICE '   Completion: %', completion_count;
    RAISE NOTICE '   Streak: %', streak_count;
    RAISE NOTICE '   Quality: %', quality_count;
    RAISE NOTICE '   Speed: %', speed_count;
    RAISE NOTICE '   Mastery: %', mastery_count;
    RAISE NOTICE '   Exploration: %', exploration_count;
    
    IF total_count >= 25 THEN
        RAISE NOTICE '✅ Seed data loaded successfully!';
    ELSE
        RAISE WARNING '⚠️  Expected more achievements. Please check seed data.';
    END IF;
END $$;

-- ==========================================
-- SEED COMPLETE
-- ==========================================