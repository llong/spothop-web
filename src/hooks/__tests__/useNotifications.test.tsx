import { renderHook, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { useNotifications } from '../useNotifications';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import supabase from 'src/supabase';

// Mock dependencies with actual atom export
vi.mock('jotai', async (importOriginal) => {
    const actual = await importOriginal<typeof import('jotai')>();
    return {
        ...actual,
        useAtomValue: vi.fn((atom) => {
            if (atom && (atom as any).debugLabel === 'user') return { user: { id: 'u1' } };
            return null;
        }),
        useSetAtom: vi.fn(() => vi.fn()),
    };
});

vi.mock('src/supabase', () => ({
    default: {
        from: vi.fn(() => ({
            update: vi.fn(() => ({
                eq: vi.fn(() => ({
                    eq: vi.fn().mockResolvedValue({ error: null })
                })),
                mockResolvedValue: vi.fn().mockResolvedValue({ error: null })
            })),
            delete: vi.fn(() => ({
                eq: vi.fn().mockResolvedValue({ error: null })
            }))
        })),
        channel: vi.fn(() => ({
            on: vi.fn().mockReturnThis(),
            subscribe: vi.fn()
        })),
        removeChannel: vi.fn()
    }
}));

// Mock useNotificationsQuery
vi.mock('../useProfileQueries', () => ({
    useNotificationsQuery: vi.fn(() => ({
        data: [{ id: 'n1', is_read: false }],
        isLoading: false
    })),
    profileKeys: {
        notifications: vi.fn(() => ['notifications'])
    }
}));

describe('useNotifications', () => {
    let queryClient: QueryClient;

    beforeEach(() => {
        vi.clearAllMocks();
        queryClient = new QueryClient();
    });

    const wrapper = ({ children }: { children: React.ReactNode }) => (
        <QueryClientProvider client={queryClient}>
            {children}
        </QueryClientProvider>
    );

    it('returns notifications and unread count', () => {
        const { result } = renderHook(() => useNotifications(), { wrapper });
        expect(result.current.notifications.length).toBe(1);
        expect(result.current.unreadCount).toBe(1);
    });

    it('marks notification as read', async () => {
        const mockUpdate = vi.fn().mockReturnValue({
            eq: vi.fn().mockResolvedValue({ error: null })
        });
        vi.mocked(supabase.from).mockReturnValue({
            update: mockUpdate
        } as any);

        const { result } = renderHook(() => useNotifications(), { wrapper });

        await act(async () => {
            await result.current.markAsRead('n1');
        });

        expect(mockUpdate).toHaveBeenCalledWith({ is_read: true });
    });
});
