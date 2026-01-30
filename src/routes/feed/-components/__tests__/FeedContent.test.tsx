import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { FeedContent } from '../FeedContent';
import { INITIAL_FEED_FILTERS } from 'src/atoms/feed';

// Mock dependencies
vi.mock('../FeedItem', () => ({
    FeedItemCard: ({ item }: any) => <div data-testid="feed-item">{item.spot_name}</div>
}));

vi.mock('../FeedItemSkeleton', () => ({
    FeedItemSkeleton: () => <div data-testid="feed-skeleton">Skeleton</div>
}));

describe('FeedContent', () => {
    const defaultProps = {
        isLoading: false,
        error: null,
        allItems: [],
        hasActiveFilters: false,
        activeTab: 0,
        setFilters: vi.fn(),
        isFetchingNextPage: false,
        hasNextPage: false,
        lastElementRef: vi.fn(),
        currentUserId: 'u1'
    };

    it('renders loading state', () => {
        render(<FeedContent {...defaultProps} isLoading={true} />);
        expect(screen.getAllByTestId('feed-skeleton')).toHaveLength(3);
    });

    it('renders error state', () => {
        // Mock window.location.reload
        const originalLocation = window.location;
        Object.defineProperty(window, 'location', {
            configurable: true,
            value: { reload: vi.fn() },
        });

        render(<FeedContent {...defaultProps} error={new Error('Failed')} />);
        expect(screen.getByText('Failed to load feed')).toBeInTheDocument();
        
        fireEvent.click(screen.getByText('Retry'));
        expect(window.location.reload).toHaveBeenCalled();

        // Restore window.location
        Object.defineProperty(window, 'location', {
            configurable: true,
            value: originalLocation,
        });
    });

    it('renders empty state without filters', () => {
        render(<FeedContent {...defaultProps} allItems={[]} />);
        expect(screen.getByText('No spots yet!')).toBeInTheDocument();
        expect(screen.getByText('Go to Spots Map')).toBeInTheDocument();
    });

    it('renders empty state with active filters', () => {
        render(<FeedContent {...defaultProps} allItems={[]} hasActiveFilters={true} />);
        expect(screen.getByText('No matches found')).toBeInTheDocument();
        
        fireEvent.click(screen.getByText('Clear All Filters'));
        expect(defaultProps.setFilters).toHaveBeenCalledWith(INITIAL_FEED_FILTERS);
    });

    it('renders feed items', () => {
        const items = [
            {
                media_id: 'm1',
                spot_name: 'Spot 1',
                // ... other required fields mocked as needed or partial since we mock the component
            }
        ] as any[];

        render(<FeedContent {...defaultProps} allItems={items} />);
        expect(screen.getByText('Spot 1')).toBeInTheDocument();
        expect(screen.getByText("You've reached the end of the global feed.")).toBeInTheDocument();
    });

    it('renders pagination loader', () => {
        const items = [{ media_id: 'm1', spot_name: 'Spot 1' }] as any[];
        render(<FeedContent {...defaultProps} allItems={items} isFetchingNextPage={true} hasNextPage={true} />);
        
        // CircularProgress renders as an SVG with role 'progressbar' usually, but here we can check for existence via class or just assume it renders if no error.
        // MUI CircularProgress:
        expect(document.querySelector('.MuiCircularProgress-root')).toBeInTheDocument();
        expect(screen.queryByText("You've reached the end of the global feed.")).not.toBeInTheDocument();
    });
});