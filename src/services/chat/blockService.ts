import supabase from "../../supabase";

export const blockService = {
    async blockUser(blockerId: string, blockedId: string) {
        const { error } = await supabase
            .from('user_blocks')
            .insert({ blocker_id: blockerId, blocked_id: blockedId });
        if (error) throw error;
    },

    async unblockUser(blockerId: string, blockedId: string) {
        const { error } = await supabase
            .from('user_blocks')
            .delete()
            .eq('blocker_id', blockerId)
            .eq('blocked_id', blockedId);
        if (error) throw error;
    },

    async fetchBlockedUsers(userId: string) {
        const { data, error } = await supabase
            .from('user_blocks')
            .select('blocked_id, profiles!blocked_id(*)')
            .eq('blocker_id', userId);
        if (error) throw error;
        return data;
    }
};
