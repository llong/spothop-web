import supabase from "@/supabase";
import type { Contest, ContestEntry } from "@/types";

export const contestService = {
    /**
     * Fetches all non-draft contests.
     */
    async fetchActiveContests(): Promise<Contest[]> {
        const { data, error } = await supabase
            .from('contests')
            .select(`
                *,
                entry_count:contest_entries(count)
            `)
            .neq('status', 'draft')
            .order('start_date', { ascending: false });

        if (error) throw error;

        return (data || []).map(contest => ({
            ...contest,
            entry_count: (contest as any).entry_count?.[0]?.count || 0
        })) as Contest[];
    },

    /**
     * Fetches a specific contest by ID.
     */
    async fetchContestById(id: string): Promise<Contest | null> {
        const { data, error } = await supabase
            .from('contests')
            .select('*')
            .eq('id', id)
            .maybeSingle();

        if (error) throw error;
        return data as Contest;
    },

    /**
     * Fetches entries for a specific contest.
     */
    async fetchContestEntries(contestId: string): Promise<ContestEntry[]> {
        let query = supabase
            .from('contest_entries')
            .select(`
                *,
                author:profiles!user_id(username, "avatarUrl"),
                spot:spots!spot_id(name, city)
            `)
            .eq('contest_id', contestId);

        const { data, error } = await query
            .neq('status', 'disqualified')
            .order('created_at', { ascending: false });

        if (error) throw error;

        const entries = data as ContestEntry[];
        if (entries.length === 0) return [];

        // Fetch media URLs for each entry
        const photoIds = entries.filter(e => e.media_type === 'photo').map(e => e.media_id);
        const videoIds = entries.filter(e => e.media_type === 'video').map(e => e.media_id);

        const [photosResult, videosResult] = await Promise.all([
            photoIds.length > 0 ? supabase.from('spot_photos').select('id, url').in('id', photoIds) : Promise.resolve({ data: [] }),
            videoIds.length > 0 ? supabase.from('spot_videos').select('id, url').in('id', videoIds) : Promise.resolve({ data: [] })
        ]);

        const mediaMap = new Map();
        photosResult.data?.forEach(p => mediaMap.set(p.id, p.url));
        videosResult.data?.forEach(v => mediaMap.set(v.id, v.url));

        // Fetch vote counts for each entry
        const entryIds = entries.map(e => e.id);
        const { data: votes } = await supabase
            .from('contest_votes')
            .select('entry_id')
            .in('entry_id', entryIds);

        const voteMap = new Map();
        votes?.forEach(v => {
            voteMap.set(v.entry_id, (voteMap.get(v.entry_id) || 0) + 1);
        });

        return entries.map(e => ({
            ...e,
            media_url: mediaMap.get(e.media_id),
            vote_count: voteMap.get(e.id) || 0
        }));
    },

    /**
     * Submits a spot to a contest.
     */
    async submitEntry(contestId: string, spotId: string, mediaType: 'photo' | 'video', mediaId: string): Promise<void> {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) throw new Error("Authentication required");

        // 1. Check for max entries per user
        const contest = await this.fetchContestById(contestId);
        if (contest?.criteria.max_entries_per_user) {
            const { count } = await supabase
                .from('contest_entries')
                .select('*', { count: 'exact', head: true })
                .eq('contest_id', contestId)
                .eq('user_id', session.user.id);

            if (count !== null && count >= contest.criteria.max_entries_per_user) {
                throw new Error(`Maximum entries reached (${contest.criteria.max_entries_per_user})`);
            }
        }

        const { error } = await supabase
            .from('contest_entries')
            .insert({
                contest_id: contestId,
                user_id: session.user.id,
                spot_id: spotId,
                media_type: mediaType,
                media_id: mediaId,
                status: 'approved' // Set to approved by default
            });

        if (error) {
            if (error.code === '23505') {
                throw new Error("You have already submitted an entry for this contest");
            }
            throw error;
        }
    },

    /**
     * Casts a vote for an entry.
     */
    async voteForEntry(contestId: string, entryId: string): Promise<void> {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) throw new Error("Authentication required");

        // Check for voting restrictions (e.g., rider type)
        const contest = await this.fetchContestById(contestId);
        if (contest?.criteria.allowed_rider_types && contest.criteria.allowed_rider_types.length > 0) {
            const { data: profile } = await supabase
                .from('profiles')
                .select('riderType')
                .eq('id', session.user.id)
                .single();

            if (!profile?.riderType || !contest.criteria.allowed_rider_types.includes(profile.riderType as any)) {
                throw new Error(`Only ${contest.criteria.allowed_rider_types.join(', ')} can vote in this contest`);
            }
        }

        // Enforce 1 vote per user per contest: 
        // Delete any existing vote in this contest before casting a new one
        await supabase
            .from('contest_votes')
            .delete()
            .eq('contest_id', contestId)
            .eq('user_id', session.user.id);

        const { error } = await supabase
            .from('contest_votes')
            .insert({
                contest_id: contestId,
                entry_id: entryId,
                user_id: session.user.id
            });

        if (error) {
            throw error;
        }
    },

    /**
     * Removes a vote for an entry.
     */
    async removeVote(entryId: string): Promise<void> {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) throw new Error("Authentication required");

        const { error } = await supabase
            .from('contest_votes')
            .delete()
            .eq('entry_id', entryId)
            .eq('user_id', session.user.id);

        if (error) throw error;
    },

    /**
     * Checks if a user has voted for a specific entry.
     */
    async hasUserVoted(entryId: string, userId: string): Promise<boolean> {
        const { data, error } = await supabase
            .from('contest_votes')
            .select('id')
            .eq('entry_id', entryId)
            .eq('user_id', userId)
            .maybeSingle();

        if (error) return false;
        return !!data;
    },

    /**
     * Deletes a user's own entry.
     */
    async retractEntry(entryId: string): Promise<void> {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) throw new Error("Authentication required");

        const { error } = await supabase
            .from('contest_entries')
            .delete()
            .eq('id', entryId)
            .eq('user_id', session.user.id);

        if (error) throw error;
    }
};
