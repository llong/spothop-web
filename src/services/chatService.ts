import supabase from "@/supabase";
import type { UserProfile } from "@/types";

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

interface InboxSummaryRow {
    conversation_id: string;
    unread_count: number;
    last_message: ChatMessage | null;
}

export const chatService = {
    // userId is kept for call-site compatibility; the RPC and RLS scope results to auth.uid().
    async fetchConversations(_userId: string): Promise<Conversation[]> {
        // One indexed query: last message + unread count per conversation (excludes rejected invites).
        const { data: summaries, error: summaryError } = await supabase.rpc('get_inbox_summary');

        if (summaryError) throw summaryError;
        if (!summaries?.length) return [];

        const summaryMap = new Map<string, InboxSummaryRow>(
            (summaries as InboxSummaryRow[]).map(s => [s.conversation_id, s])
        );
        const conversationIds = [...summaryMap.keys()];

        const { data: convData, error: convError } = await supabase
            .from('conversations')
            .select(`
                *,
                conversation_participants (*)
            `)
            .in('id', conversationIds)
            .order('last_message_at', { ascending: false });

        if (convError) throw convError;

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

            const summary = summaryMap.get(c.id);
            const lastMsg = summary?.last_message ?? undefined;

            return {
                ...c,
                participants,
                lastMessage: lastMsg ? {
                    ...lastMsg,
                    author: profileMap.get(lastMsg.sender_id)
                } : undefined,
                unreadCount: summary?.unread_count ?? 0
            };
        });
    },

    /**
     * Fetches the most recent `limit` messages of a conversation, returned oldest-first.
     */
    async fetchMessages(conversationId: string, limit: number = 50): Promise<ChatMessage[]> {
        const { data: latest, error } = await supabase
            .from('messages')
            .select('*')
            .eq('conversation_id', conversationId)
            .order('created_at', { ascending: false })
            .limit(limit);

        if (error) throw error;
        if (!latest) return [];
        const data = [...latest].reverse();

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

    async getOrCreate1on1(myId: string, targetUserId: string): Promise<string> {
        const { data: existing, error } = await supabase
            .rpc('find_common_1on1_conversation', {
                user_a: myId,
                user_b: targetUserId
            });

        if (error) {
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

    async respondToInvite(conversationId: string, userId: string, status: 'accepted' | 'rejected') {
        const { error } = await supabase
            .from('conversation_participants')
            .update({ status })
            .eq('conversation_id', conversationId)
            .eq('user_id', userId);

        if (error) throw error;
    },

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

    async fetchConversationDetails(conversationId: string): Promise<Conversation> {
        const { data, error } = await supabase
            .from('conversations')
            .select(`
                *,
                conversation_participants (*)
            `)
            .eq('id', conversationId)
            .single();

        if (error) throw error;

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
            unreadCount: 0 
        };
    }
};

export { blockService } from './chat/blockService';
