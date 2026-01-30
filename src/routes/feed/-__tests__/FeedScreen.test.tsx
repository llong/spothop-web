import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createStore, Provider } from 'jotai';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

// Mock jotai/utils before importing atoms
vi.mock('jotai/utils', async () => {
    const { atom } = await vi.importActual<typeof import('jotai')>('jotai');
    return {
        atomWithStorage: (key: any, initialValue: any) => atom(initialValue),
    };
});

import { FeedScreen } from '../index.lazy';
import { userAtom } from 'src/atoms/auth';
import { feedFiltersAtom, INITIAL_FEED_FILTERS } from 'src/atoms/feed';

// Mock dependencies
vi.mock('@tanstack/react-router', () => ({
    createLazyFileRoute: () => (config: any) => config.component,
    Link: ({ children, to }: any) => <a href={to}>{children}</a>,
    useNavigate: () => vi.fn()
}));

vi.mock('src/hooks/useFeedQueries', () => ({
    useFeedQuery: vi.fn(() => ({
        data: {
            pages: [[
                {
                    media_id: 'm1',
                    spot_id: 's1',
                    uploader_id: 'u1',
                    media_url: 'https://example.com/image.jpg',
                    media_type: 'photo',
                    created_at: new Date().toISOString(),
                    spot_name: 'Test Spot',
                    uploader_username: 'skater1',
                    uploader_display_name: 'Skater 1',
                    is_liked_by_user: false,
                    is_favorited_by_user: false,
                    like_count: 0,
                    comment_count: 0
                }
            ]]
        },
        fetchNextPage: vi.fn(),
        hasNextPage: false,
        isFetchingNextPage: false,
        isLoading: false,
        error: null
    })),
    useToggleMediaLike: vi.fn(() => ({ mutate: vi.fn() })),
    useToggleFollow: vi.fn(() => ({ mutate: vi.fn() })),
    useMediaComments: vi.fn(() => ({ data: [], isLoading: false })),
    usePostMediaComment: vi.fn(() => ({ mutate: vi.fn() })),
    useToggleCommentReaction: vi.fn(() => ({ mutate: vi.fn() }))
}));

vi.mock('src/hooks/useSpotFavorites', () => ({
    useSpotFavorites: vi.fn(() => ({
        toggleFavorite: vi.fn()
    }))
}));

// Properly mock IntersectionObserver as a class
class MockIntersectionObserver {
    observe = vi.fn();
    disconnect = vi.fn();
    unobserve = vi.fn();
}
vi.stubGlobal('IntersectionObserver', MockIntersectionObserver);

const queryClient = new QueryClient({
    defaultOptions: {
        queries: {
            retry: false,
        },
    },
});

describe('FeedScreen', () => {
    let testStore: any;

    beforeEach(() => {
        testStore = createStore();
        testStore.set(userAtom, { user: { id: 'u1' } } as any);
        testStore.set(feedFiltersAtom, INITIAL_FEED_FILTERS);
    });

    it('renders the global feed content', () => {
        render(
            <Provider store={testStore}>
                <QueryClientProvider client={queryClient}>
                    <FeedScreen />
                </QueryClientProvider>
            </Provider>
        );

        expect(screen.getByText('Test Spot')).toBeInTheDocument();
    });
});