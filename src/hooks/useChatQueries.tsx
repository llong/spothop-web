import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { chatService } from '../services/chatService';
import { useEffect } from 'react';
import supabase from '../supabase';

export const chatKeys = {
    all: ['chat'] as const,
    inbox: (userId: string) => [...chatKeys.all, 'inbox', userId] as const,
    thread: (conversationId: string) => [...chatKeys.all, 'thread', conversationId] as const,
};

/**
 * Hook for managing the chat inbox (conversations list).
 */
export function useConversationsQuery(userId?: string) {
    const queryClient = useQueryClient();

    const query = useQuery({
        queryKey: userId ? chatKeys.inbox(userId) : [],
        queryFn: () => userId ? chatService.fetchConversations(userId) : null,
        enabled: !!userId,
        staleTime: 1000 * 60, // 1 minute
    });

    // Real-time updates for the inbox
    // Optimized: instead of listening to ALL conversations and messages (which causes 3M+ system calls),
    // we listen to the notifications table which is already filtered by userId.
    useEffect(() => {
        if (!userId) return;

        const channel = supabase
            .channel(`inbox_trigger_${userId}`)
            .on(
                'postgres_changes',
                {
                    event: 'INSERT',
                    schema: 'public',
                    table: 'notifications',
                    filter: `user_id=eq.${userId}`
                },
                (payload: any) => {
                    // Only invalidate if the notification is related to chat
                    if (payload.new.type === 'new_message' || payload.new.type === 'chat') {
                        queryClient.invalidateQueries({ queryKey: chatKeys.inbox(userId) });
                    }
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [userId, queryClient]);

    return query;
}

/**
 * Hook for managing a specific message thread.
 */
export function useMessagesQuery(conversationId?: string) {
    const queryClient = useQueryClient();

    const query = useQuery({
        queryKey: conversationId ? chatKeys.thread(conversationId) : [],
        queryFn: () => conversationId ? chatService.fetchMessages(conversationId) : null,
        enabled: !!conversationId,
    });

    // Real-time updates for the active thread
    useEffect(() => {
        if (!conversationId) return;

        const channel = supabase
            .channel(`thread_${conversationId}`)
            .on(
                'postgres_changes',
                {
                    event: 'INSERT',
                    schema: 'public',
                    table: 'messages',
                    filter: `conversation_id=eq.${conversationId}`
                },
                () => {
                    // Update cache optimistically or invalidate
                    queryClient.invalidateQueries({ queryKey: chatKeys.thread(conversationId) });
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [conversationId, queryClient]);

    return query;
}

/**
 * Hook for fetching a single conversation's metadata.
 */
export function useConversationQuery(conversationId: string, userId?: string) {
    return useQuery({
        queryKey: ['chat', 'detail', conversationId],
        queryFn: () => userId ? chatService.fetchConversationDetails(conversationId) : null,
        enabled: !!conversationId && !!userId,
    });
}

/**
 * Hook for sending messages.
 */
export function useSendMessageMutation(conversationId: string) {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ senderId, content }: { senderId: string, content: string }) =>
            chatService.sendMessage(conversationId, senderId, content),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: chatKeys.thread(conversationId) });
        }
    });
}
