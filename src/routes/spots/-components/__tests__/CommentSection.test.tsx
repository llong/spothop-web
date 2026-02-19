import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { CommentSection } from '../CommentSection';
import { useComments } from 'src/hooks/useComments';
import { useAtomValue } from 'jotai';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

vi.mock('jotai', async () => {
    const actual = await vi.importActual('jotai');
    return {
        ...actual as any,
        useAtomValue: vi.fn(),
    };
});
vi.mock('src/hooks/useComments');
vi.mock('../CommentForm', () => ({
    CommentForm: () => <div data-testid="comment-form" />
}));
vi.mock('../CommentItem', () => ({
    CommentItem: ({ comment }: any) => <div data-testid="comment-item">{comment.content}</div>
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

describe('CommentSection', () => {
    const mockSpotId = 'spot-123';
    
    beforeEach(() => {
        vi.clearAllMocks();
        vi.mocked(useComments).mockReturnValue({
            comments: [],
            loading: false,
            fetchComments: vi.fn(),
            addComment: vi.fn(),
            updateComment: vi.fn(),
            deleteComment: vi.fn(),
            toggleReaction: vi.fn(),
        } as any);
    });

    it('renders login message when user is not authenticated', () => {
        vi.mocked(useAtomValue).mockReturnValue(null);
        render(<CommentSection spotId={mockSpotId} />, { wrapper });
        expect(screen.getByText(/Please log in to join the discussion/i)).toBeInTheDocument();
    });

    it('renders comment form when user is authenticated', () => {
        vi.mocked(useAtomValue).mockReturnValue({ user: { id: 'u1' } });
        render(<CommentSection spotId={mockSpotId} />, { wrapper });
        expect(screen.getByTestId('comment-form')).toBeInTheDocument();
    });

    it('renders loading state', () => {
        vi.mocked(useComments).mockReturnValue({
            comments: [],
            loading: true,
            fetchComments: vi.fn(),
        } as any);
        render(<CommentSection spotId={mockSpotId} />, { wrapper });
        expect(screen.getByRole('progressbar')).toBeInTheDocument();
    });

    it('renders empty state message', () => {
        render(<CommentSection spotId={mockSpotId} />, { wrapper });
        expect(screen.getByText(/No comments yet/i)).toBeInTheDocument();
    });

    it('renders comments list', () => {
        const mockComments = [
            { id: 'c1', content: 'First comment', created_at: new Date().toISOString(), author: { username: 'u1' }, reactions: [] },
            { id: 'c2', content: 'Second comment', created_at: new Date().toISOString(), author: { username: 'u2' }, reactions: [] }
        ];
        vi.mocked(useComments).mockReturnValue({
            comments: mockComments,
            loading: false,
            fetchComments: vi.fn(),
        } as any);
        
        render(<CommentSection spotId={mockSpotId} />, { wrapper });
        expect(screen.getByText('First comment')).toBeInTheDocument();
        expect(screen.getByText('Second comment')).toBeInTheDocument();
    });
});
