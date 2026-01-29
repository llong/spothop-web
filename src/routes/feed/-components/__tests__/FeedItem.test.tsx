import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { FeedItemCard } from '../FeedItem';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { FeedItem } from 'src/types';

// Mock dependencies
vi.mock('src/hooks/useFeedQueries', () => ({
    useToggleMediaLike: vi.fn(() => ({
        mutate: vi.fn(),
        isPending: false
    }))
}));

vi.mock('src/hooks/useSpotFavorites', () => ({
    useSpotFavorites: vi.fn(() => ({
        toggleFavorite: vi.fn()
    }))
}));

const mockItem: FeedItem = {
    media_id: 'm1',
    spot_id: 's1',
    uploader_id: 'u1',
    media_url: 'https://example.com/image.jpg',
    media_type: 'photo',
    created_at: new Date().toISOString(),
    spot_name: 'Test Spot',
    city: 'Test City',
    country: 'Test Country',
    uploader_username: 'skater1',
    uploader_avatar_url: null,
    like_count: 5,
    comment_count: 2,
    popularity_score: 10,
    is_liked_by_user: false,
    is_favorited_by_user: false
};

const queryClient = new QueryClient();

const wrapper = ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>
        {children}
    </QueryClientProvider>
);

describe('FeedItemCard', () => {
    it('renders feed item details correctly', () => {
        render(<FeedItemCard item={mockItem} />, { wrapper });

        expect(screen.getByText('@skater1')).toBeInTheDocument();
        expect(screen.getByText('Test Spot')).toBeInTheDocument();
        expect(screen.getByText('Test City, Test Country')).toBeInTheDocument();
        expect(screen.getByText('5')).toBeInTheDocument();
        expect(screen.getByText('2')).toBeInTheDocument();
    });

    it('displays photo when media_type is photo', () => {
        render(<FeedItemCard item={mockItem} />, { wrapper });
        const img = screen.getByAltText('Spot media');
        expect(img).toHaveAttribute('src', mockItem.media_url);
    });

    it('opens comment dialog when comment button is clicked', () => {
        render(<FeedItemCard item={mockItem} />, { wrapper });
        const commentBtn = screen.getByTestId('ChatBubbleOutlineIcon').parentElement;
        fireEvent.click(commentBtn!);
        expect(screen.getByText('Comments')).toBeInTheDocument();
    });
});