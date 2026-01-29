import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { FeedCommentDialog } from '../FeedCommentDialog';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useMediaComments } from 'src/hooks/useFeedQueries';
import type { FeedItem } from 'src/types';
import React from 'react';

// Mock queries
vi.mock('src/hooks/useFeedQueries', () => ({
    useMediaComments: vi.fn(() => ({
        data: [
            { id: 'c1', content: 'Cool trick!', created_at: new Date().toISOString(), author: { username: 'skater2', avatarUrl: null } }
        ],
        isLoading: false
    })),
    usePostMediaComment: vi.fn(() => ({
        mutateAsync: vi.fn().mockResolvedValue({}),
        isPending: false
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
    uploader_username: 'skater1',
    uploader_avatar_url: null,
    like_count: 0,
    comment_count: 0,
    popularity_score: 0
};

const queryClient = new QueryClient();

const wrapper = ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>
        {children}
    </QueryClientProvider>
);

describe('FeedCommentDialog', () => {
    it('renders comments when open', () => {
        render(
            <FeedCommentDialog 
                open={true} 
                onClose={() => {}} 
                mediaId={mockItem.media_id}
                mediaType={mockItem.media_type}
                userId="u1"
            />, 
            { wrapper }
        );

        expect(screen.getByText('Comments')).toBeInTheDocument();
        expect(screen.getByText('Cool trick!')).toBeInTheDocument();
        expect(screen.getByText('@skater2')).toBeInTheDocument();
    });

    it('shows empty message when no comments', () => {
        vi.mocked(useMediaComments).mockReturnValue({ data: [], isLoading: false } as any);

        render(
            <FeedCommentDialog 
                open={true} 
                onClose={() => {}} 
                mediaId={mockItem.media_id}
                mediaType={mockItem.media_type}
                userId="u1"
            />, 
            { wrapper }
        );

        expect(screen.getByText('No comments yet.')).toBeInTheDocument();
    });
});