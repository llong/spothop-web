import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { FeedItemCard } from '../FeedItem';
import type { FeedItem as FeedItemType } from 'src/types';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import React from 'react';

// Mock router
vi.mock('@tanstack/react-router', () => ({
    Link: ({ children, to, params, style }: any) => (
        <div data-testid="router-link" data-to={to} data-params={JSON.stringify(params)} style={style}>
            {children}
        </div>
    ),
}));

// Mock hooks
const mockMutate = vi.fn();
vi.mock('src/hooks/useFeedQueries', () => ({
    useToggleMediaLike: () => ({
        mutate: mockMutate
    }),
    useMediaComments: () => ({
        data: [],
        isLoading: false
    }),
    usePostMediaComment: () => ({
        mutate: vi.fn()
    })
}));

const mockToggleFavorite = vi.fn();
vi.mock('src/hooks/useSpotFavorites', () => ({
    useSpotFavorites: () => ({
        toggleFavorite: mockToggleFavorite
    })
}));

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

describe('FeedItemCard', () => {
    const mockItem: FeedItemType = {
        media_id: 'm1',
        spot_id: 's1',
        uploader_id: 'u1',
        media_url: 'https://example.com/photo.jpg',
        media_type: 'photo',
        created_at: new Date().toISOString(),
        spot_name: 'Test Spot',
        city: 'Test City',
        country: 'Test Country',
        uploader_username: 'testuser',
        uploader_avatar_url: null,
        like_count: 5,
        comment_count: 2,
        popularity_score: 10,
        is_liked_by_user: false,
        is_favorited_by_user: false
    };

    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('renders item details correctly', () => {
        render(<FeedItemCard item={mockItem} />, { wrapper: createWrapper() });

        expect(screen.getByText('@testuser')).toBeInTheDocument();
        expect(screen.getByText('Test Spot')).toBeInTheDocument();
        expect(screen.getByText(/Test City, Test Country/)).toBeInTheDocument();
        expect(screen.getByText('5')).toBeInTheDocument();
        expect(screen.getByText('2')).toBeInTheDocument();
    });

    it('handles like click', () => {
        render(<FeedItemCard item={mockItem} />, { wrapper: createWrapper() });

        const likeButton = screen.getAllByRole('button')[0]; // Like button is first
        fireEvent.click(likeButton);

        expect(mockMutate).toHaveBeenCalledWith({
            mediaId: 'm1',
            mediaType: 'photo'
        });
    });

    it('handles favorite click', () => {
        render(<FeedItemCard item={mockItem} />, { wrapper: createWrapper() });

        const favoriteButton = screen.getAllByRole('button')[3]; // Favorite/Bookmark button is last
        fireEvent.click(favoriteButton);

        expect(mockToggleFavorite).toHaveBeenCalled();
    });

    it('opens comment dialog on comment icon click', () => {
        render(<FeedItemCard item={mockItem} />, { wrapper: createWrapper() });

        const commentButton = screen.getAllByRole('button')[1]; // Comment button is second
        fireEvent.click(commentButton);

        expect(screen.getByRole('dialog')).toBeInTheDocument();
    });
});
