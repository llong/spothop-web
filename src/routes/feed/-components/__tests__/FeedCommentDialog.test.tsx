import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { FeedCommentDialog } from '../FeedCommentDialog';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import React from 'react';

// Mock hooks
const mockMutateAsync = vi.fn();
vi.mock('src/hooks/useFeedQueries', () => ({
    useMediaComments: () => ({
        data: [
            { id: 'c1', content: 'Great photo!', created_at: new Date().toISOString(), author: { username: 'user1', avatarUrl: null } }
        ],
        isLoading: false
    }),
    usePostMediaComment: () => ({
        mutateAsync: mockMutateAsync
    })
}));

// Mock CommentForm
vi.mock('src/routes/spots/-components/CommentForm', () => ({
    CommentForm: ({ onSubmit }: any) => (
        <button data-testid="mock-submit" onClick={() => onSubmit('new comment')}>Post</button>
    )
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

describe('FeedCommentDialog', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('renders comments correctly', () => {
        render(
            <FeedCommentDialog
                open={true}
                onClose={() => { }}
                mediaId="m1"
                mediaType="photo"
                userId="u1"
            />,
            { wrapper: createWrapper() }
        );

        expect(screen.getByText('Great photo!')).toBeInTheDocument();
        expect(screen.getByText('@user1')).toBeInTheDocument();
    });

    it('calls post comment mutation on submit', async () => {
        render(
            <FeedCommentDialog
                open={true}
                onClose={() => { }}
                mediaId="m1"
                mediaType="photo"
                userId="u1"
            />,
            { wrapper: createWrapper() }
        );

        fireEvent.click(screen.getByTestId('mock-submit'));

        await waitFor(() => {
            expect(mockMutateAsync).toHaveBeenCalledWith({
                userId: 'u1',
                mediaId: 'm1',
                mediaType: 'photo',
                content: 'new comment'
            });
        });
    });

    it('shows login message if userId is missing', () => {
        render(
            <FeedCommentDialog
                open={true}
                onClose={() => { }}
                mediaId="m1"
                mediaType="photo"
            />,
            { wrapper: createWrapper() }
        );

        expect(screen.getByText('Please log in to comment.')).toBeInTheDocument();
    });
});
