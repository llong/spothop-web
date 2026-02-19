import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { FeedCommentDialog } from '../FeedCommentDialog';
import { useMediaComments, usePostMediaComment, useToggleCommentReaction } from 'src/hooks/useFeedQueries';

vi.mock('src/hooks/useFeedQueries');

describe('FeedCommentDialog', () => {
    const mockItem = { media_id: 'm1', media_type: 'photo' } as any;
    const mockOnClose = vi.fn();
    const mockMutateAsync = vi.fn();
    const mockMutate = vi.fn();

    beforeEach(() => {
        vi.clearAllMocks();
        vi.mocked(useMediaComments).mockReturnValue({ data: [], isLoading: false } as any);
        vi.mocked(usePostMediaComment).mockReturnValue({ mutateAsync: mockMutateAsync, isPending: false } as any);
        vi.mocked(useToggleCommentReaction).mockReturnValue({ mutate: mockMutate } as any);
    });

    it('renders null if media info missing', () => {
        const { container } = render(<FeedCommentDialog open={true} onClose={mockOnClose} item={{} as any} />);
        expect(container).toBeEmptyDOMElement();
    });

    it('renders comments list', () => {
        const mockComments = [
            { id: 'c1', content: 'Nice!', author: { username: 'user1' }, created_at: new Date().toISOString(), reactions: { likes: 0 } }
        ];
        vi.mocked(useMediaComments).mockReturnValue({ data: mockComments, isLoading: false } as any);

        render(<FeedCommentDialog open={true} onClose={mockOnClose} item={mockItem} userId="u1" />);
        expect(screen.getByText('Nice!')).toBeInTheDocument();
        expect(screen.getByText('@user1')).toBeInTheDocument();
    });

    it('posts a new comment', async () => {
        render(<FeedCommentDialog open={true} onClose={mockOnClose} item={mockItem} userId="u1" spotId="s1" />);
        
        const input = screen.getByPlaceholderText('Add a comment...');
        fireEvent.change(input, { target: { value: 'Awesome!' } });
        
        const submitBtn = screen.getByTestId('SendIcon').parentElement;
        fireEvent.click(submitBtn!);

        expect(mockMutateAsync).toHaveBeenCalledWith({
            mediaId: 'm1',
            mediaType: 'photo',
            content: 'Awesome!',
            spotId: 's1'
        });
    });

    it('toggles reaction', () => {
        const mockComments = [
            { id: 'c1', content: 'Nice!', author: { username: 'user1' }, created_at: new Date().toISOString(), reactions: { likes: 0 } }
        ];
        vi.mocked(useMediaComments).mockReturnValue({ data: mockComments, isLoading: false } as any);

        render(<FeedCommentDialog open={true} onClose={mockOnClose} item={mockItem} userId="u1" />);
        
        const likeBtn = screen.getByTestId('FavoriteBorderIcon').parentElement;
        fireEvent.click(likeBtn!);

        expect(mockMutate).toHaveBeenCalledWith({ commentId: 'c1' });
    });
});
