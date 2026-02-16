import supabase from "@/supabase";
import type { Contest, ContestEntryStatus } from "@/types";

export const adminContestService = {
    /**
     * Fetches all contests for the admin dashboard.
     */
    async fetchAllContests(): Promise<Contest[]> {
        const { data, error } = await supabase
            .from('contests')
            .select('*')
            .order('created_at', { ascending: false });

        if (error) throw error;
        return data as Contest[];
    },

    /**
     * Creates a new contest.
     */
    async createContest(contest: Partial<Contest>, flyerFile?: File | null): Promise<Contest> {
        let flyerUrl = contest.flyer_url;
        if (flyerFile) {
            flyerUrl = await this.uploadFlyer(flyerFile);
        }

        const { data, error } = await supabase
            .from('contests')
            .insert({ ...contest, flyer_url: flyerUrl })
            .select()
            .single();

        if (error) throw error;
        return data as Contest;
    },

    /**
     * Updates an existing contest.
     */
    async updateContest(id: string, updates: Partial<Contest>, flyerFile?: File | null): Promise<Contest> {
        let flyerUrl = updates.flyer_url;
        if (flyerFile) {
            flyerUrl = await this.uploadFlyer(flyerFile);
        }

        const { data, error } = await supabase
            .from('contests')
            .update({ ...updates, flyer_url: flyerUrl })
            .eq('id', id)
            .select()
            .single();

        if (error) throw error;
        return data as Contest;
    },

    /**
     * Deletes a contest and its related entries/votes.
     */
    async deleteContest(id: string): Promise<void> {
        const { error } = await supabase
            .from('contests')
            .delete()
            .eq('id', id);

        if (error) throw error;
    },

    /**
     * Moderates a contest entry.
     */
    async moderateEntry(entryId: string, status: ContestEntryStatus): Promise<void> {
        const { error } = await supabase
            .from('contest_entries')
            .update({ status })
            .eq('id', entryId);

        if (error) throw error;
    },

    /**
     * Uploads a contest flyer.
     */
    async uploadFlyer(file: File): Promise<string> {
        const fileExt = file.name.split('.').pop();
        const fileName = `${Math.random()}.${fileExt}`;
        const filePath = `contest-flyers/${fileName}`;

        const { error: uploadError } = await supabase.storage
            .from('spot-media')
            .upload(filePath, file);

        if (uploadError) throw uploadError;

        const { data: { publicUrl } } = supabase.storage
            .from('spot-media')
            .getPublicUrl(filePath);

        return publicUrl;
    }
};
