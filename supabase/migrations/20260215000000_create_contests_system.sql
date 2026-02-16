-- Migration: Create Contests System
-- Created at: 2026-02-15

-- 1. Create Contests Table
CREATE TABLE public.contests (
    id UUID PRIMARY KEY DEFAULT extensions.uuid_generate_v4(),
    title TEXT NOT NULL,
    description TEXT,
    flyer_url TEXT,
    start_date TIMESTAMP WITH TIME ZONE NOT NULL,
    end_date TIMESTAMP WITH TIME ZONE NOT NULL,
    prize_info TEXT,
    voting_type TEXT NOT NULL CHECK (voting_type IN ('judges', 'public')),
    criteria JSONB NOT NULL DEFAULT '{}'::jsonb,
    status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'active', 'voting', 'finished')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- 2. Create Contest Entries Table
CREATE TABLE public.contest_entries (
    id UUID PRIMARY KEY DEFAULT extensions.uuid_generate_v4(),
    contest_id UUID NOT NULL REFERENCES public.contests(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    spot_id UUID NOT NULL REFERENCES public.spots(id) ON DELETE CASCADE,
    media_type TEXT NOT NULL CHECK (media_type IN ('photo', 'video')),
    media_id UUID NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'disqualified')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    
    -- Ensure a user can only submit the same spot once to a contest
    UNIQUE(contest_id, user_id, spot_id)
);

-- 3. Create Contest Votes Table
CREATE TABLE public.contest_votes (
    id UUID PRIMARY KEY DEFAULT extensions.uuid_generate_v4(),
    contest_id UUID NOT NULL REFERENCES public.contests(id) ON DELETE CASCADE,
    entry_id UUID NOT NULL REFERENCES public.contest_entries(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    
    -- Ensure one vote per user per entry
    UNIQUE(entry_id, user_id)
);

-- 4. Create Contest Judges Table (optional, for 'judges' voting type)
CREATE TABLE public.contest_judges (
    contest_id UUID NOT NULL REFERENCES public.contests(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    PRIMARY KEY (contest_id, user_id)
);

-- 5. Enable RLS
ALTER TABLE public.contests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contest_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contest_votes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contest_judges ENABLE ROW LEVEL SECURITY;

-- 6. RLS Policies

-- Contests: Everyone can read active/finished contests, only admins can manage
CREATE POLICY "Contests are viewable by everyone" ON public.contests
    FOR SELECT USING (status != 'draft' OR (SELECT role FROM profiles WHERE id = auth.uid()) = 'admin');

CREATE POLICY "Admins can manage contests" ON public.contests
    FOR ALL USING ((SELECT role FROM profiles WHERE id = auth.uid()) = 'admin');

-- Entries: Everyone can read approved entries, users can read their own
CREATE POLICY "Approved entries are viewable by everyone" ON public.contest_entries
    FOR SELECT USING (status = 'approved' OR user_id = auth.uid() OR (SELECT role FROM profiles WHERE id = auth.uid()) = 'admin');

CREATE POLICY "Users can submit entries" ON public.contest_entries
    FOR INSERT WITH CHECK (auth.uid() = user_id AND NOT (SELECT "isBanned" FROM profiles WHERE id = auth.uid()));

CREATE POLICY "Admins can moderate entries" ON public.contest_entries
    FOR UPDATE USING ((SELECT role FROM profiles WHERE id = auth.uid()) = 'admin');

-- Votes: Viewable by everyone, users can vote if contest is in 'voting' status
CREATE POLICY "Votes are viewable by everyone" ON public.contest_votes
    FOR SELECT USING (true);

CREATE POLICY "Users can vote during voting period" ON public.contest_votes
    FOR INSERT WITH CHECK (
        auth.uid() = user_id AND 
        EXISTS (
            SELECT 1 FROM contests c 
            JOIN contest_entries e ON e.contest_id = c.id
            WHERE e.id = entry_id AND c.status = 'voting'
        )
    );

-- Judges: Viewable by everyone, managed by admins
CREATE POLICY "Judges are viewable by everyone" ON public.contest_judges
    FOR SELECT USING (true);

CREATE POLICY "Admins can manage judges" ON public.contest_judges
    FOR ALL USING ((SELECT role FROM profiles WHERE id = auth.uid()) = 'admin');

-- 7. Triggers for updated_at
CREATE TRIGGER handle_updated_at_contests
    BEFORE UPDATE ON public.contests
    FOR EACH ROW EXECUTE PROCEDURE extensions.moddatetime (updated_at);
