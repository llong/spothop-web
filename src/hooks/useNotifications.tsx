import { useEffect } from 'react';
import supabase from 'src/supabase';
import { useAtomValue, useSetAtom, atom } from 'jotai';
import { userAtom } from 'src/atoms/auth';
import { useNotificationsQuery, profileKeys } from './useProfileQueries';
import { useQueryClient } from '@tanstack/react-query';

export const globalToastAtom = atom<{
    message: string;
    open: boolean;
    conversationId?: string;
} | null>(null);

export function useNotifications() {
    const setToast = useSetAtom(globalToastAtom);
    const user = useAtomValue(userAtom);
    const queryClient = useQueryClient();

    // Use Query hook
    const { data: notificationsData, isLoading } = useNotificationsQuery(user?.user.id);
    const notifications = notificationsData || [];
    const unreadCount = notifications.filter(n => !n.is_read).length;

    const markAsRead = async (notificationId: string) => {
        try {
            const { error } = await supabase
                .from('notifications')
                .update({ is_read: true })
                .eq('id', notificationId);

            if (error) throw error;
            queryClient.invalidateQueries({ queryKey: profileKeys.notifications(user!.user.id) });
        } catch (error) {
            console.error('Error marking notification as read:', error);
        }
    };

    const deleteNotification = async (notificationId: string) => {
        try {
            const { error } = await supabase
                .from('notifications')
                .delete()
                .eq('id', notificationId);

            if (error) throw error;
            queryClient.invalidateQueries({ queryKey: profileKeys.notifications(user!.user.id) });
        } catch (error) {
            console.error('Error deleting notification:', error);
        }
    };

    const markAllAsRead = async () => {
        if (!user?.user.id) return;
        try {
            const { error } = await supabase
                .from('notifications')
                .update({ is_read: true })
                .eq('user_id', user.user.id)
                .eq('is_read', false);

            if (error) throw error;
            queryClient.invalidateQueries({ queryKey: profileKeys.notifications(user.user.id) });
        } catch (error) {
            console.error('Error marking all notifications as read:', error);
        }
    };

    useEffect(() => {
        // Subscribe to new notifications
        if (!user?.user.id) return;

        const channel = supabase
            .channel(`user_notifications_${user.user.id}`)
            .on(
                'postgres_changes',
                {
                    event: 'INSERT',
                    schema: 'public',
                    table: 'notifications',
                    filter: `user_id=eq.${user.user.id}`
                },
                (payload) => {
                    const notification = payload.new as any;

                    // Show a toast for new messages specifically
                    if (notification.type === 'new_message') {
                        setToast({
                            message: 'New message received!',
                            open: true,
                            conversationId: notification.context_id
                        });
                    }

                    queryClient.invalidateQueries({ queryKey: profileKeys.notifications(user.user.id) });
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [user, queryClient]);

    return {
        notifications,
        unreadCount,
        loading: isLoading,
        markAsRead,
        markAllAsRead,
        deleteNotification,
        fetchNotifications: () => queryClient.invalidateQueries({ queryKey: profileKeys.notifications(user!.user.id) })
    };
}
