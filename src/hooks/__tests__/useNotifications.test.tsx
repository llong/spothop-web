import { renderHook, act } from '@testing-library/react';
import { useNotifications } from '../useNotifications';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useAtomValue } from 'jotai';
import supabase from 'src/supabase';
import React from 'react';

// Mock dependencies
vi.mock('jotai', async (importOriginal) => {
    const actual = await importOriginal<typeof import('jotai')>();
    return {
        ...actual,
        useAtomValue: vi.fn(),
        useSetAtom: vi.fn(() => vi.fn()),
    };
});

vi.mock('src/supabase', () => ({
    default: {
        from: vi.fn(() => ({
            update: vi.fn().mockReturnThis(),
            delete: vi.fn().mockReturnThis(),
            eq: vi.fn().mockReturnThis(),
        })),
        channel: vi.fn(() => ({
            on: vi.fn().mockReturnThis(),
            subscribe: vi.fn().mockReturnThis(),
        })),
        removeChannel: vi.fn(),
    }
}));

vi.mock('../useProfileQueries', () => ({
    useNotificationsQuery: vi.fn(() => ({
        data: [{ id: 'n1', is_read: false }, { id: 'n2', is_read: true }],
        isLoading: false
    })),
    profileKeys: {
        notifications: vi.fn(() => ['notifications'])
    }
}));

const queryClient = new QueryClient({
    defaultOptions: {
        queries: {
            retry: false,
        },
    },
});

const wrapper = ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>
        {children}
    </QueryClientProvider>
);

describe('useNotifications hook', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        (useAtomValue as any).mockReturnValue({ user: { id: 'user123' } });
    });

    it('returns notifications and unread count correctly', () => {
        const { result } = renderHook(() => useNotifications(), { wrapper });

        expect(result.current.notifications).toHaveLength(2);
        expect(result.current.unreadCount).toBe(1);
    });

    it('marks a notification as read', async () => {
        const { result } = renderHook(() => useNotifications(), { wrapper });

        await act(async () => {
            await result.current.markAsRead('n1');
        });

        expect(supabase.from).toHaveBeenCalledWith('notifications');
    });

    it('marks all as read', async () => {
        const { result } = renderHook(() => useNotifications(), { wrapper });

        await act(async () => {
            await result.current.markAllAsRead();
        });

        expect(supabase.from).toHaveBeenCalledWith('notifications');
    });
});
