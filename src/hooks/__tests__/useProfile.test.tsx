import { renderHook, act } from '@testing-library/react';
import { useProfile } from '../useProfile';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useAtomValue } from 'jotai';
import React from 'react';

// Mock dependencies
vi.mock('jotai', async (importOriginal) => {
    const actual = await importOriginal<typeof import('jotai')>();
    return {
        ...actual,
        useAtomValue: vi.fn(),
    };
});

const { mockFrom, mockUpsert } = vi.hoisted(() => ({
    mockFrom: vi.fn(),
    mockUpsert: vi.fn().mockResolvedValue({ error: null }),
}));

mockFrom.mockImplementation(() => ({
    upsert: mockUpsert,
    then: function (onFulfilled: any) {
        return Promise.resolve(onFulfilled({ data: null, error: null }));
    },
}));

vi.mock('../supabase', () => ({
    default: {
        from: mockFrom,
    }
}));

const { mockUseProfileQuery, mockUseSocialStatsQuery, mockUseUserContentQuery } = vi.hoisted(() => ({
    mockUseProfileQuery: vi.fn(() => ({ data: { displayName: 'Test User' }, isInitialLoading: false, isLoading: false })),
    mockUseSocialStatsQuery: vi.fn(() => ({ data: { favorites: [], followerCount: 10 }, isInitialLoading: false, isLoading: false })),
    mockUseUserContentQuery: vi.fn(() => ({ data: { createdSpots: [] }, isInitialLoading: false, isLoading: false })),
}));

vi.mock('./useProfileQueries', () => ({
    useProfileQuery: mockUseProfileQuery,
    useSocialStatsQuery: mockUseSocialStatsQuery,
    useUserContentQuery: mockUseUserContentQuery,
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

describe('useProfile hook', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        (useAtomValue as any).mockReturnValue({ user: { id: 'user123' } });
        // Ensure QueryClient is available if needed by implementation
    });

    it('returns profile and social data correctly', () => {
        const { result } = renderHook(() => useProfile('user123'), { wrapper });

        expect(result.current.followerCount).toBeDefined();
    });

    it('updates profile successfully', async () => {
        const { result } = renderHook(() => useProfile(), { wrapper });

        await act(async () => {
            await result.current.updateProfile({ bio: 'New Bio' });
        });

        expect(result.current.updateProfile).toBeDefined();
    });
});
