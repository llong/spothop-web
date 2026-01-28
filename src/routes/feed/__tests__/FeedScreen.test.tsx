import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Route } from '../index.lazy';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import React from 'react';
import { useFeedQuery } from 'src/hooks/useFeedQueries';

// Mock atom values
vi.mock('jotai', async (importOriginal) => {
    const actual = await importOriginal<typeof import('jotai')>();
    return {
        ...actual,
        useAtomValue: vi.fn((atom) => {
            if (atom && (atom as any).debugLabel === 'user') return { user: { id: 'u1' } };
            return null;
        }),
    };
});

// Mock hooks
vi.mock('src/hooks/useFeedQueries', () => ({
    useFeedQuery: vi.fn(),
    useToggleMediaLike: () => ({ mutate: vi.fn() }),
    useMediaComments: () => ({ data: [], isLoading: false }),
    usePostMediaComment: () => ({ mutate: vi.fn() })
}));

// Mock router
vi.mock('@tanstack/react-router', () => ({
    createLazyFileRoute: () => (config: any) => config,
    Link: ({ children, to }: any) => <a href={to}>{children}</a>
}));

// Mock FeedItemCard
vi.mock('../-components/FeedItem', () => ({
    FeedItemCard: ({ item }: any) => <div>FeedItemCard: {item.spot_name}</div>
}));

// Mock IntersectionObserver as a proper class
class MockIntersectionObserver {
    observe = vi.fn();
    unobserve = vi.fn();
    disconnect = vi.fn();
}
window.IntersectionObserver = MockIntersectionObserver as any;

const createWrapper = () => {
    const queryClient = new QueryClient({
        defaultOptions: {
            queries: { retry: false },
        },
    });
    return ({ children }: { children: React.ReactNode }) => (
        <QueryClientProvider client={queryClient}>
            {children}
        </QueryClientProvider>
    );
};

describe('FeedScreen', () => {
    const FeedScreen = (Route as any).component;

    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('renders loading state', () => {
        vi.mocked(useFeedQuery).mockReturnValue({ isLoading: true } as any);

        render(<FeedScreen />, { wrapper: createWrapper() });
        expect(screen.getByRole('progressbar')).toBeInTheDocument();
    });

    it('renders feed items', () => {
        vi.mocked(useFeedQuery).mockReturnValue({
            isLoading: false,
            data: {
                pages: [[{ media_id: '1', spot_name: 'Super Spot' }]]
            },
            hasNextPage: false
        } as any);

        render(<FeedScreen />, { wrapper: createWrapper() });
        expect(screen.getByText('FeedItemCard: Super Spot')).toBeInTheDocument();
    });

    it('renders empty state fallback', () => {
        vi.mocked(useFeedQuery).mockReturnValue({
            isLoading: false,
            data: { pages: [[]] },
            hasNextPage: false
        } as any);

        render(<FeedScreen />, { wrapper: createWrapper() });
        expect(screen.getByText('No spots yet!')).toBeInTheDocument();
        expect(screen.getByText(/Be the first to share/)).toBeInTheDocument();
    });
});
