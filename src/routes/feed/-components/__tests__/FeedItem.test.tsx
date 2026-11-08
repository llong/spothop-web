import { render, screen, fireEvent, within } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { FeedItemCard } from '@/routes/feed/-components/FeedItem';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { FeedItem } from '@/types';
import React from 'react';

// Mock dependencies
vi.mock('@tanstack/react-router', () => ({
    Link: ({ children, to }: any) => <a href={to}>{children}</a>,
    useNavigate: () => vi.fn()
}));

vi.mock('@/hooks/useFeedQueries', () => ({
    useToggleMediaLike: vi.fn(() => ({
        mutate: vi.fn(),
        isPending: false
    })),
    useToggleFollow: vi.fn(() => ({
        mutate: vi.fn(),
        isPending: false
    })),
    useMediaComments: vi.fn(() => ({ data: [], isLoading: false })),
    usePostMediaComment: vi.fn(() => ({ mutate: vi.fn(), isPending: false })),
    useToggleCommentReaction: vi.fn(() => ({ mutate: vi.fn(), isPending: false })),
}));

vi.mock('@/hooks/useSpotFavorites', () => ({
    useSpotFavorites: vi.fn(() => ({
        isFavorited: false, // Default to not favorited
        toggleFavorite: vi.fn(),
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
    uploader_display_name: 'Skater 1',
    uploader_avatar_url: null,
    is_followed_by_user: false,
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
        render(<FeedItemCard items={[mockItem]} />, { wrapper });

        expect(screen.getByText(/^@skater1 - .+ ago$/)).toBeInTheDocument();
        expect(screen.getByText('Test Spot')).toBeInTheDocument();
        expect(screen.getByText('Test City, Test Country')).toBeInTheDocument();
        // Check for the presence of the favorite icon, not a count.
        // It should be FavoriteBorderIcon since isFavorited is mocked as false.
        expect(screen.getByTestId('FavoriteBorderIcon')).toBeInTheDocument();
        expect(screen.getByText('2')).toBeInTheDocument(); // Comment count is still displayed
    });

    it('displays photo when media_type is photo', () => {
        render(<FeedItemCard items={[mockItem]} />, { wrapper });
        const img = screen.getByAltText('Spot media');
        expect(img).toHaveAttribute('src', mockItem.media_url);
    });

    it('calls onCommentClick when comment button is clicked', () => {
        const onCommentClick = vi.fn();
        render(<FeedItemCard items={[mockItem]} onCommentClick={onCommentClick} />, { wrapper });
        const commentBtn = screen.getByTestId('ChatBubbleOutlineIcon').parentElement;
        fireEvent.click(commentBtn!);
        expect(onCommentClick).toHaveBeenCalledWith(mockItem);
    });

    describe('a post with several photos/videos', () => {
        const second: FeedItem = { ...mockItem, media_id: 'm2', media_url: 'https://example.com/second.jpg', comment_count: 7 };
        const video: FeedItem = { ...mockItem, media_id: 'm3', media_type: 'video', media_url: 'https://example.com/v.mp4', comment_count: 0 };

        it('shows the media as a carousel starting at the first item', () => {
            render(<FeedItemCard items={[mockItem, second, video]} />, { wrapper });

            const dots = screen.getAllByRole('button', { name: /Go to item/ });
            expect(dots).toHaveLength(3);
            expect(dots[0]).toHaveAttribute('aria-current', 'true');
            expect(within(screen.getByLabelText('1 of 3')).getByAltText('Spot media')).toHaveAttribute('src', mockItem.media_url);
        });

        it('moves between slides and shows the comment count of the visible one', () => {
            render(<FeedItemCard items={[mockItem, second]} />, { wrapper });

            fireEvent.click(screen.getByTestId('KeyboardArrowRightIcon').parentElement!);

            expect(screen.getByRole('button', { name: 'Go to item 2 of 2' })).toHaveAttribute('aria-current', 'true');
            expect(within(screen.getByLabelText('2 of 2')).getByAltText('Spot media')).toHaveAttribute('src', second.media_url);
            expect(screen.getByText('7')).toBeInTheDocument();
        });

        it('jumps straight to an item when its dot is clicked', () => {
            render(<FeedItemCard items={[mockItem, second, video]} />, { wrapper });

            fireEvent.click(screen.getByRole('button', { name: 'Go to item 2 of 3' }));

            expect(screen.getByRole('button', { name: 'Go to item 2 of 3' })).toHaveAttribute('aria-current', 'true');
            expect(screen.getByText('7')).toBeInTheDocument(); // the comment count now follows the second item
        });

        it('opens comments for the visible slide, not the first one', () => {
            const onCommentClick = vi.fn();
            render(<FeedItemCard items={[mockItem, second]} onCommentClick={onCommentClick} />, { wrapper });

            fireEvent.click(screen.getByTestId('KeyboardArrowRightIcon').parentElement!);
            fireEvent.click(screen.getByTestId('ChatBubbleOutlineIcon').parentElement!);

            expect(onCommentClick).toHaveBeenCalledWith(second);
        });

        it('shows one header for the whole post', () => {
            render(<FeedItemCard items={[mockItem, second]} />, { wrapper });
            expect(screen.getAllByText(/^@skater1 - .+ ago$/)).toHaveLength(1);
        });
    });
});
