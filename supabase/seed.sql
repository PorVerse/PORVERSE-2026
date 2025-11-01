-- ==========================================
-- PORVERSE V2 - SEED DATA
-- Portal data pentru toate cele 6 portale
-- ==========================================

-- ==========================================
-- PORTALS SEED DATA
-- ==========================================

INSERT INTO public.portals (portal_code, title, description, icon, color_primary, color_secondary, order_index) VALUES
('p0', 'Self Discovery', 'Embark on a journey to understand your true self, uncover your core values, and build authentic self-awareness', '🔮', '#8b5cf6', '#a78bfa', 1),
('p1', 'Relationships', 'Transform your connections with others through improved communication, empathy, and healthy boundaries', '💝', '#ec4899', '#f472b6', 2),
('p2', 'Career & Purpose', 'Align your professional life with your passions and find meaningful work that fulfills you', '⭐', '#eab308', '#facc15', 3),
('p3', 'Health & Vitality', 'Cultivate physical wellness, mental clarity, and sustainable energy through holistic practices', '🌱', '#22c55e', '#4ade80', 4),
('p4', 'Financial Freedom', 'Build wealth consciousness, create abundance, and develop a healthy relationship with money', '💰', '#3b82f6', '#60a5fa', 5),
('p5', 'Life Purpose', 'Discover your unique mission, connect with your calling, and create lasting impact', '🎯', '#f97316', '#fb923c', 6);

-- ==========================================
-- P0: SELF DISCOVERY - PORTAL STEPS
-- ==========================================

INSERT INTO public.portal_steps (portal_id, step_number, title, description, content, estimated_duration) 
SELECT id, 1, 'Welcome to Self Discovery', 'Begin your journey of self-exploration', 
'{"sections": [{"type": "text", "content": "Welcome to the Self Discovery Portal. This is where your transformation begins. In this step, you will learn about the power of self-awareness and why understanding yourself is the foundation of all personal growth."}, {"type": "exercise", "title": "Reflection Exercise", "content": "Take 5 minutes to write down: Who am I right now? What do I value most? What makes me unique?"}]}',
15 FROM public.portals WHERE portal_code = 'p0';

INSERT INTO public.portal_steps (portal_id, step_number, title, description, content, estimated_duration)
SELECT id, 2, 'Core Values Assessment', 'Identify what truly matters to you',
'{"sections": [{"type": "text", "content": "Your core values are the fundamental beliefs that guide your decisions and actions. Identifying them is crucial for living an authentic life."}, {"type": "quiz", "questions": ["What activities make you lose track of time?", "What injustices make you angry?", "What achievements are you most proud of?"]}]}',
20 FROM public.portals WHERE portal_code = 'p0';

INSERT INTO public.portal_steps (portal_id, step_number, title, description, content, estimated_duration)
SELECT id, 3, 'Shadow Work Introduction', 'Explore your hidden aspects',
'{"sections": [{"type": "text", "content": "Shadow work involves acknowledging and integrating the parts of yourself you may have suppressed or denied. This is deep, transformative work."}, {"type": "exercise", "title": "Shadow Journaling", "content": "Write about a trait you dislike in others. Could this be a reflection of something within yourself?"}]}',
25 FROM public.portals WHERE portal_code = 'p0';

INSERT INTO public.portal_steps (portal_id, step_number, title, description, content, estimated_duration)
SELECT id, 4, 'Strengths & Talents', 'Recognize your unique gifts',
'{"sections": [{"type": "text", "content": "Everyone has unique strengths and talents. Recognizing yours empowers you to contribute meaningfully to the world."}, {"type": "assessment", "title": "Strengths Finder", "content": "Complete this assessment to discover your top 5 strengths"}]}',
20 FROM public.portals WHERE portal_code = 'p0';

INSERT INTO public.portal_steps (portal_id, step_number, title, description, content, estimated_duration)
SELECT id, 5, 'Creating Your Vision', 'Design your ideal future self',
'{"sections": [{"type": "text", "content": "Now that you understand yourself better, its time to envision who you want to become. Your vision will guide your transformation."}, {"type": "exercise", "title": "Future Self Visualization", "content": "Close your eyes and imagine yourself 5 years from now, living your ideal life. Describe this vision in detail."}]}',
30 FROM public.portals WHERE portal_code = 'p0';

-- ==========================================
-- P1: RELATIONSHIPS - PORTAL STEPS
-- ==========================================

INSERT INTO public.portal_steps (portal_id, step_number, title, description, content, estimated_duration)
SELECT id, 1, 'Understanding Relationships', 'The foundation of human connection',
'{"sections": [{"type": "text", "content": "Relationships are the cornerstone of a fulfilling life. Understanding how you relate to others is essential for building meaningful connections."}, {"type": "reflection", "content": "Think about your most important relationships. What patterns do you notice?"}]}',
15 FROM public.portals WHERE portal_code = 'p1';

INSERT INTO public.portal_steps (portal_id, step_number, title, description, content, estimated_duration)
SELECT id, 2, 'Communication Mastery', 'Learn to express yourself authentically',
'{"sections": [{"type": "text", "content": "Effective communication is the bridge between misunderstanding and connection. Learn techniques for expressing yourself clearly and listening deeply."}, {"type": "exercise", "title": "Active Listening Practice", "content": "Practice reflecting back what someone says before responding"}]}',
25 FROM public.portals WHERE portal_code = 'p1';

INSERT INTO public.portal_steps (portal_id, step_number, title, description, content, estimated_duration)
SELECT id, 3, 'Healthy Boundaries', 'Protect your energy and wellbeing',
'{"sections": [{"type": "text", "content": "Boundaries are not walls; they are gates that protect what is sacred while allowing healthy exchange. Learn to set and maintain boundaries."}, {"type": "exercise", "title": "Boundary Setting", "content": "Identify one area where you need better boundaries and practice saying no"}]}',
20 FROM public.portals WHERE portal_code = 'p1';

INSERT INTO public.portal_steps (portal_id, step_number, title, description, content, estimated_duration)
SELECT id, 4, 'Conflict Resolution', 'Transform disagreements into growth',
'{"sections": [{"type": "text", "content": "Conflict is inevitable, but it doesnt have to be destructive. Learn to navigate disagreements with grace and find win-win solutions."}, {"type": "framework", "title": "Nonviolent Communication", "content": "Observe, Feel, Need, Request - a framework for resolving conflicts"}]}',
30 FROM public.portals WHERE portal_code = 'p1';

INSERT INTO public.portal_steps (portal_id, step_number, title, description, content, estimated_duration)
SELECT id, 5, 'Building Deep Connections', 'Create relationships that nourish your soul',
'{"sections": [{"type": "text", "content": "Deep, meaningful relationships require vulnerability, authenticity, and consistent effort. Learn to cultivate connections that truly matter."}, {"type": "action", "title": "Connection Challenge", "content": "Reach out to someone important and have a deep, meaningful conversation"}]}',
25 FROM public.portals WHERE portal_code = 'p1';

-- ==========================================
-- P2: CAREER & PURPOSE - PORTAL STEPS
-- ==========================================

INSERT INTO public.portal_steps (portal_id, step_number, title, description, content, estimated_duration)
SELECT id, 1, 'Career Assessment', 'Evaluate your current professional path',
'{"sections": [{"type": "text", "content": "Understanding where you are professionally is the first step to creating meaningful change. Lets assess your current situation honestly."}, {"type": "assessment", "questions": ["Are you fulfilled by your current work?", "Does your career align with your values?", "What would you change if you could?"]}]}',
20 FROM public.portals WHERE portal_code = 'p2';

INSERT INTO public.portal_steps (portal_id, step_number, title, description, content, estimated_duration)
SELECT id, 2, 'Discovering Your Passions', 'Find what truly excites you',
'{"sections": [{"type": "text", "content": "Passion is the fuel for sustainable success. When you love what you do, work becomes play. Lets discover what ignites your soul."}, {"type": "exercise", "title": "Passion Inventory", "content": "List 10 things you love doing. Look for patterns and themes"}]}',
25 FROM public.portals WHERE portal_code = 'p2';

INSERT INTO public.portal_steps (portal_id, step_number, title, description, content, estimated_duration)
SELECT id, 3, 'Skills & Expertise', 'Identify and develop your professional strengths',
'{"sections": [{"type": "text", "content": "Your unique combination of skills makes you valuable. Understanding and developing these skills is key to career success."}, {"type": "mapping", "title": "Skills Matrix", "content": "Map your current skills and identify areas for growth"}]}',
30 FROM public.portals WHERE portal_code = 'p2';

INSERT INTO public.portal_steps (portal_id, step_number, title, description, content, estimated_duration)
SELECT id, 4, 'Career Vision & Planning', 'Design your professional future',
'{"sections": [{"type": "text", "content": "With clarity on your passions and skills, you can now design a career path that aligns with who you are and what you want to contribute."}, {"type": "planning", "title": "5-Year Career Plan", "content": "Create a roadmap from where you are to where you want to be"}]}',
35 FROM public.portals WHERE portal_code = 'p2';

INSERT INTO public.portal_steps (portal_id, step_number, title, description, content, estimated_duration)
SELECT id, 5, 'Taking Action', 'Move from planning to doing',
'{"sections": [{"type": "text", "content": "Plans are worthless without action. Lets create concrete steps you can take today to move toward your career goals."}, {"type": "action", "title": "30-Day Action Plan", "content": "Define 3 specific actions you will take in the next 30 days"}]}',
20 FROM public.portals WHERE portal_code = 'p2';

-- Continue for P3, P4, P5... (abbreviated for space)

-- ==========================================
-- P3: HEALTH & VITALITY - PORTAL STEPS
-- ==========================================

INSERT INTO public.portal_steps (portal_id, step_number, title, description, content, estimated_duration)
SELECT id, 1, 'Holistic Health Assessment', 'Evaluate your overall wellbeing',
'{"sections": [{"type": "text", "content": "True health encompasses physical, mental, and emotional wellbeing. Lets assess where you are in each area."}]}',
20 FROM public.portals WHERE portal_code = 'p3';

INSERT INTO public.portal_steps (portal_id, step_number, title, description, content, estimated_duration)
SELECT id, 2, 'Nutrition Fundamentals', 'Fuel your body optimally',
'{"sections": [{"type": "text", "content": "You are what you eat. Learn the foundations of nutrition that support vibrant health and sustained energy."}]}',
25 FROM public.portals WHERE portal_code = 'p3';

INSERT INTO public.portal_steps (portal_id, step_number, title, description, content, estimated_duration)
SELECT id, 3, 'Movement & Exercise', 'Build strength and vitality',
'{"sections": [{"type": "text", "content": "Regular movement is essential for health. Discover exercise approaches that work for your body and lifestyle."}]}',
30 FROM public.portals WHERE portal_code = 'p3';

-- ==========================================
-- P4: FINANCIAL FREEDOM - PORTAL STEPS
-- ==========================================

INSERT INTO public.portal_steps (portal_id, step_number, title, description, content, estimated_duration)
SELECT id, 1, 'Money Mindset', 'Transform your relationship with money',
'{"sections": [{"type": "text", "content": "Your beliefs about money shape your financial reality. Lets examine and upgrade your money mindset."}]}',
25 FROM public.portals WHERE portal_code = 'p4';

INSERT INTO public.portal_steps (portal_id, step_number, title, description, content, estimated_duration)
SELECT id, 2, 'Financial Assessment', 'Understand your current financial situation',
'{"sections": [{"type": "text", "content": "You cannot manage what you dont measure. Lets get clear on your financial reality."}]}',
30 FROM public.portals WHERE portal_code = 'p4';

-- ==========================================
-- P5: LIFE PURPOSE - PORTAL STEPS
-- ==========================================

INSERT INTO public.portal_steps (portal_id, step_number, title, description, content, estimated_duration)
SELECT id, 1, 'The Quest for Meaning', 'Why purpose matters',
'{"sections": [{"type": "text", "content": "Living with purpose gives life meaning and direction. Begin your quest to discover your unique mission."}]}',
20 FROM public.portals WHERE portal_code = 'p5';

INSERT INTO public.portal_steps (portal_id, step_number, title, description, content, estimated_duration)
SELECT id, 2, 'Your Unique Gifts', 'Identify what only you can offer',
'{"sections": [{"type": "text", "content": "You have gifts that the world needs. Discovering and sharing them is your purpose."}]}',
25 FROM public.portals WHERE portal_code = 'p5';