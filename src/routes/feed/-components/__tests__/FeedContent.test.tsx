import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { FeedContent } from '../FeedContent';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

vi.mock('@tanstack/react-router', () => ({
    Link: ({ children }: any) => <div>{children}</div>
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

describe('FeedContent', () => {
    const mockProps = {
        isLoading: false,
        error: null,
        allItems: [],
        hasActiveFilters: false,
        activeTab: 0,
        setFilters: vi.fn(),
        isFetchingNextPage: false,
        hasNextPage: false,
        lastElementRef: vi.fn(),
    };

    it('renders loading state with skeletons', () => {
        render(<FeedContent {...mockProps} isLoading={true} />, { wrapper });
        // FeedItemSkeleton components are rendered
        expect(screen.getAllByTestId('feed-item-skeleton')).toHaveLength(3);
    });

    it('renders error state', () => {
        render(<FeedContent {...mockProps} error={new Error('Failed')} />, { wrapper });
        expect(screen.getByText(/Failed to load feed/i)).toBeInTheDocument();
    });

    it('renders empty state without filters', () => {
        render(<FeedContent {...mockProps} />, { wrapper });
        expect(screen.getByText(/No spots yet!/i)).toBeInTheDocument();
        expect(screen.getByText(/The global feed is currently empty/i)).toBeInTheDocument();
    });

    it('renders empty state with filters', () => {
        render(<FeedContent {...mockProps} hasActiveFilters={true} />, { wrapper });
        expect(screen.getByText(/No matches found/i)).toBeInTheDocument();
        expect(screen.getByText(/Clear All Filters/i)).toBeInTheDocument();
    });

    it('renders following tab empty state', () => {
        render(<FeedContent {...mockProps} activeTab={1} />, { wrapper });
        expect(screen.getByText(/You aren't following anyone yet/i)).toBeInTheDocument();
    });

    it('renders feed items', () => {
        const mockItems = [
            { media_id: 'm1', spot_id: 's1', author: { username: 'user1' }, media_url: 'url1', created_at: new Date().toISOString(), type: 'photo' }
        ];
        render(<FeedContent {...mockProps} allItems={mockItems as any} />, { wrapper });
        // FeedItemCard should be rendered
        expect(screen.getByTestId('FavoriteBorderIcon')).toBeInTheDocument();
    });

    it('renders end of feed message', () => {
        const mockItems = [{ media_id: 'm1', spot_id: 's1', author: { username: 'user1' }, media_url: 'url1', created_at: new Date().toISOString(), type: 'photo' }];
        render(<FeedContent {...mockProps} allItems={mockItems as any} hasNextPage={false} />, { wrapper });
        expect(screen.getByText(/reached the end/i)).toBeInTheDocument();
    });
});
