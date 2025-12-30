import supabase from "../supabase";
import type { UserProfile } from "../types";

export interface ChatMessage {
    id: string;
    conversation_id: string;
    sender_id: string;
    content: string;
    is_read: boolean;
    created_at: string;
    author?: {
        username: string;
        avatarUrl: string | null;
    };
}

export interface ConversationParticipant {
    id: string;
    user_id: string;
    role: 'admin' | 'member';
    status: 'pending' | 'accepted' | 'rejected';
    joined_at: string;
    profile?: UserProfile;
}

export interface Conversation {
    id: string;
    name: string | null;
    is_group: boolean;
    created_by: string;
    created_at: string;
    last_message_at: string;
    participants: ConversationParticipant[];
    lastMessage?: ChatMessage;
    unreadCount: number;
}

export const chatService = {
    /**
     * Fetches all conversations for the current user.
     * Includes participants and the last message for each chat.
     */
    async fetchConversations(userId: string): Promise<Conversation[]> {
        // 1. Get IDs of conversations the user is part of
        const { data: participationData, error: partError } = await supabase
            .from('conversation_participants')
            .select('conversation_id')
            .eq('user_id', userId)
            .neq('status', 'rejected');

        if (partError) throw partError;
        if (!participationData?.length) return [];

        const conversationIds = participationData.map(p => p.conversation_id);

        // 2. Fetch full conversation details
        const { data: convData, error: convError } = await supabase
            .from('conversations')
            .select(`
                *,
                conversation_participants (*),
                messages (*)
            `)
            .in('id', conversationIds)
            .order('last_message_at', { ascending: false });

        if (convError) throw convError;

        // 3. Enrich with profiles
        const allParticipantIds = [...new Set((convData || []).flatMap(c =>
            c.conversation_participants.map((p: any) => p.user_id)
        ))];

        const { data: profiles } = await supabase
            .from('profiles')
            .select('id, username, "avatarUrl"')
            .in('id', allParticipantIds);

        const profileMap = new Map(profiles?.map(p => [p.id, p]));

        return (convData || []).map(c => {
            const participants = c.conversation_participants.map((p: any) => ({
                ...p,
                profile: profileMap.get(p.user_id)
            }));

            // Find last message
            const sortedMessages = [...(c.messages || [])].sort((a, b) =>
                new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
            );

            const lastMsg = sortedMessages[0];
            const unreadCount = sortedMessages.filter(m => !m.is_read && m.sender_id !== userId).length;

            return {
                ...c,
                participants,
                lastMessage: lastMsg ? {
                    ...lastMsg,
                    author: profileMap.get(lastMsg.sender_id)
                } : undefined,
                unreadCount
            };
        });
    },

    /**
     * Fetches message history for a specific conversation.
     */
    async fetchMessages(conversationId: string): Promise<ChatMessage[]> {
        const { data, error } = await supabase
            .from('messages')
            .select('*')
            .eq('conversation_id', conversationId)
            .order('created_at', { ascending: true });

        if (error) throw error;
        if (!data) return [];

        // Fetch authors
        const authorIds = [...new Set(data.map(m => m.sender_id))];
        const { data: profiles } = await supabase
            .from('profiles')
            .select('id, username, "avatarUrl"')
            .in('id', authorIds);

        const profileMap = new Map(profiles?.map(p => [p.id, p]));

        return data.map(m => ({
            ...m,
            author: profileMap.get(m.sender_id)
        }));
    },

    /**
     * Sends a new message in a conversation.
     */
    async sendMessage(conversationId: string, senderId: string, content: string) {
        const { data, error } = await supabase
            .from('messages')
            .insert({
                conversation_id: conversationId,
                sender_id: senderId,
                content
            })
            .select()
            .single();

        if (error) throw error;
        return data;
    },

    /**
     * Finds an existing 1-on-1 conversation or creates a new one.
     */
    async getOrCreate1on1(myId: string, targetUserId: string): Promise<string> {
        // 1. Find conversations where both are participants
        const { data: existing, error } = await supabase
            .rpc('find_common_1on1_conversation', {
                user_a: myId,
                user_b: targetUserId
            });

        if (error) {
            // Fallback if RPC isn't available: manual search
            const { data: myConvs } = await supabase
                .from('conversation_participants')
                .select('conversation_id')
                .eq('user_id', myId);

            const { data: targetConvs } = await supabase
                .from('conversation_participants')
                .select('conversation_id')
                .eq('user_id', targetUserId);

            const common = myConvs?.filter(m => targetConvs?.some(t => t.conversation_id === m.conversation_id));

            if (common?.length) {
                // Check if it's actually a 1-on-1
                for (const c of common) {
                    const { count } = await supabase
                        .from('conversation_participants')
                        .select('*', { count: 'exact', head: true })
                        .eq('conversation_id', c.conversation_id);
                    if (count === 2) return c.conversation_id;
                }
            }
        } else if (existing) {
            return existing;
        }

        // 2. Create new if none found
        const { data: newConv, error: createError } = await supabase
            .from('conversations')
            .insert({ is_group: false, created_by: myId })
            .select()
            .single();

        if (createError) throw createError;

        await supabase.from('conversation_participants').insert([
            { conversation_id: newConv.id, user_id: myId, role: 'admin', status: 'accepted' },
            { conversation_id: newConv.id, user_id: targetUserId, role: 'member', status: 'accepted' }
        ]);

        return newConv.id;
    },

    /**
     * Responds to a group invitation.
     */
    async respondToInvite(conversationId: string, userId: string, status: 'accepted' | 'rejected') {
        const { error } = await supabase
            .from('conversation_participants')
            .update({ status })
            .eq('conversation_id', conversationId)
            .eq('user_id', userId);

        if (error) throw error;
    },

    /**
     * Creates a new group chat.
     */
    async createGroup(name: string, participantIds: string[], creatorId: string): Promise<string> {
        const { data: newConv, error: createError } = await supabase
            .from('conversations')
            .insert({
                name,
                is_group: true,
                created_by: creatorId
            })
            .select()
            .single();

        if (createError) throw createError;

        const participants = [
            { conversation_id: newConv.id, user_id: creatorId, role: 'admin', status: 'accepted' },
            ...participantIds.map(id => ({
                conversation_id: newConv.id,
                user_id: id,
                role: 'member',
                status: 'pending'
            }))
        ];

        const { error: partError } = await supabase
            .from('conversation_participants')
            .insert(participants);

        if (partError) throw partError;

        return newConv.id;
    },

    /**
     * Fetches details for a single conversation.
     */
    async fetchConversationDetails(conversationId: string): Promise<Conversation> {
        const { data, error } = await supabase
            .from('conversations')
            .select(`
                *,
                conversation_participants (*),
                messages (*)
            `)
            .eq('id', conversationId)
            .single();

        if (error) throw error;

        // Enrich with profiles
        const participantIds = data.conversation_participants.map((p: any) => p.user_id);
        const { data: profiles } = await supabase
            .from('profiles')
            .select('id, username, "avatarUrl"')
            .in('id', participantIds);

        const profileMap = new Map(profiles?.map(p => [p.id, p]));
        const participants = data.conversation_participants.map((p: any) => ({
            ...p,
            profile: profileMap.get(p.user_id)
        }));

        return {
            ...data,
            participants,
            unreadCount: 0 // Not needed for detail view
        };
    }
};

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
