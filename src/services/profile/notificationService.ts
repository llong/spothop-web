import supabase from "../../supabase";
import type { AppNotification } from "../../types";

export const notificationService = {
    async fetchNotifications(userId: string): Promise<AppNotification[]> {
        const { data, error } = await supabase
            .from('notifications')
            .select('*')
            .eq('user_id', userId)
            .order('created_at', { ascending: false });

        if (error) throw error;
        if (!data) return [];

        const actorIds = [...new Set(data.map((n: any) => n.actor_id))];
        const { data: profiles } = await supabase
            .from('profiles')
            .select('id, username, "avatarUrl"')
            .in('id', actorIds);

        const profileMap = new Map(profiles?.map(p => [p.id, p]));

        return data.map((n: any) => {
            const actor = profileMap.get(n.actor_id);
            return {
                ...n,
                actor: {
                    username: actor?.username || 'unknown',
                    avatarUrl: actor?.avatarUrl || null
                }
            };
        });
    },
};
