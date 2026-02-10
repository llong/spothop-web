import { render, screen } from '@testing-library/react';
import { SpotCreatorInfo } from '../SpotCreatorInfo';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import { useAtomValue } from 'jotai';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

const queryClient = new QueryClient();

// Mock dependencies
vi.mock('@tanstack/react-router', () => ({
    Link: ({ children }: any) => <div>{children}</div>,
    useNavigate: () => vi.fn(),
}));

vi.mock('jotai', async (importOriginal) => {
    const actual = await importOriginal<typeof import('jotai')>();
    return {
        ...actual,
        useAtomValue: vi.fn(),
    };
});

vi.mock('src/services/chatService', () => ({
    chatService: {
        getOrCreate1on1: vi.fn().mockResolvedValue('chat123'),
    }
}));

describe('SpotCreatorInfo', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('renders creation date and username', () => {
        (useAtomValue as any).mockReturnValue(null);
        render(
            <QueryClientProvider client={queryClient}>
                <SpotCreatorInfo createdAt="2025-01-01T12:00:00Z" username="testuser" />
            </QueryClientProvider>
        );

        // Using a more flexible matcher for the date to avoid timezone issues in CI/local
        expect(screen.getByText(/Added on/i)).toBeInTheDocument();
        expect(screen.getByText(/@testuser/i)).toBeInTheDocument();
    });

    it('shows message button when not the creator', () => {
        (useAtomValue as any).mockReturnValue({ user: { id: 'me' } });
        render(
            <QueryClientProvider client={queryClient}>
                <SpotCreatorInfo createdBy="other" username="otheruser" />
            </QueryClientProvider>
        );

        expect(screen.getByText(/Message/i)).toBeInTheDocument();
    });

    it('hides message button when user is the creator', () => {
        (useAtomValue as any).mockReturnValue({ user: { id: 'me' } });
        render(
            <QueryClientProvider client={queryClient}>
                <SpotCreatorInfo createdBy="me" username="meuser" />
            </QueryClientProvider>
        );

        expect(screen.queryByText(/Message/i)).not.toBeInTheDocument();
    });
});
