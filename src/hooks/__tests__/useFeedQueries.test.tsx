import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock AsyncStorage MUST be before other imports that use it
vi.mock('@react-native-async-storage/async-storage', () => ({
    default: {
        getItem: vi.fn(() => Promise.resolve(null)),
        setItem: vi.fn(() => Promise.resolve()),
        removeItem: vi.fn(() => Promise.resolve()),
    },
    getItem: vi.fn(() => Promise.resolve(null)),
    setItem: vi.fn(() => Promise.resolve()),
    removeItem: vi.fn(() => Promise.resolve()),
}));

import { renderHook, waitFor } from '@testing-library/react';
import { 
    useFeedQuery, 
    useToggleMediaLike, 
    useMediaComments, 
    usePostMediaComment,
    useToggleFollow,
    useToggleCommentReaction
} from '../useFeedQueries';
import { feedService } from '../../services/feedService';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Provider } from 'jotai';

vi.mock('../../services/feedService', () => ({
    feedService: {
        fetchGlobalFeed: vi.fn(),
        toggleMediaLike: vi.fn(),
        fetchMediaComments: vi.fn(),
        postMediaComment: vi.fn(),
        toggleFollow: vi.fn(),
        toggleCommentReaction: vi.fn()
    }
}));

const createWrapper = () => {
    const queryClient = new QueryClient({
        defaultOptions: {
            queries: {
                retry: false,
            },
        },
    });
    return ({ children }: { children: React.ReactNode }) => (
        <Provider>
            <QueryClientProvider client={queryClient}>
                {children}
            </QueryClientProvider>
        </Provider>
    );
};

describe('useFeedQueries', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    describe('useFeedQuery', () => {
        it('fetches feed data', async () => {
            const mockData = [{ media_id: '1', spot_name: 'Spot 1' }];
            vi.mocked(feedService.fetchGlobalFeed).mockResolvedValue(mockData as any);

            const { result } = renderHook(() => useFeedQuery('u1'), {
                wrapper: createWrapper()
            });

            await waitFor(() => expect(result.current.isSuccess).toBe(true));
            expect(result.current.data?.pages[0]).toEqual(mockData);
            expect(feedService.fetchGlobalFeed).toHaveBeenCalledWith(10, 0, 'u1', undefined);
        });
    });

    describe('useToggleMediaLike', () => {
        it('toggles media like', async () => {
            vi.mocked(feedService.toggleMediaLike).mockResolvedValue(undefined);

            const { result } = renderHook(() => useToggleMediaLike(), {
                wrapper: createWrapper()
            });

            await result.current.mutateAsync({ mediaId: 'm1', mediaType: 'photo' });
            expect(feedService.toggleMediaLike).toHaveBeenCalledWith('m1', 'photo');
        });
    });

    describe('useToggleFollow', () => {
        it('toggles follow status', async () => {
            vi.mocked(feedService.toggleFollow).mockResolvedValue(undefined);

            const { result } = renderHook(() => useToggleFollow(), {
                wrapper: createWrapper()
            });

            await result.current.mutateAsync('u2');
            expect(feedService.toggleFollow).toHaveBeenCalledWith('u2');
        });
    });

    describe('useMediaComments', () => {
        it('fetches comments for media', async () => {
            const mockComments = [{ id: 'c1', content: 'test' }];
            vi.mocked(feedService.fetchMediaComments).mockResolvedValue(mockComments as any);

            const { result } = renderHook(() => useMediaComments('m1', 'photo'), {
                wrapper: createWrapper()
            });

            await waitFor(() => expect(result.current.isSuccess).toBe(true));
            expect(result.current.data).toEqual(mockComments);
        });
    });

    describe('usePostMediaComment', () => {
        it('posts a comment', async () => {
            const mockComment = { id: 'c2', content: 'new' };
            vi.mocked(feedService.postMediaComment).mockResolvedValue(mockComment as any);

            const { result } = renderHook(() => usePostMediaComment(), {
                wrapper: createWrapper()
            });

            const newComment = await result.current.mutateAsync({
                mediaId: 'm1',
                mediaType: 'photo',
                content: 'new'
            });

            expect(newComment).toEqual(mockComment);
            expect(feedService.postMediaComment).toHaveBeenCalledWith('m1', 'photo', 'new', undefined);
        });
    });

    describe('useToggleCommentReaction', () => {
        it('toggles comment reaction', async () => {
            vi.mocked(feedService.toggleCommentReaction).mockResolvedValue(undefined);

            const { result } = renderHook(() => useToggleCommentReaction(), {
                wrapper: createWrapper()
            });

            await result.current.mutateAsync({ commentId: 'c1', reactionType: 'like' });
            expect(feedService.toggleCommentReaction).toHaveBeenCalledWith('c1', 'like');
        });
    });
});