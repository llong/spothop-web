import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { CreateGroupDialog } from '../CreateGroupDialog';
import supabase from 'src/supabase';
import { chatService } from 'src/services/chatService';
import { useQueryClient } from '@tanstack/react-query';
import { useNavigate } from '@tanstack/react-router';
import { vi, describe, it, expect, beforeEach } from 'vitest';

// Mock dependencies
vi.mock('src/supabase', () => ({
    default: {
        from: vi.fn(),
    },
}));
vi.mock('src/services/chatService');
vi.mock('@tanstack/react-query', async () => {
    const actual = await vi.importActual('@tanstack/react-query');
    return {
        ...actual,
        useQueryClient: vi.fn(),
    };
});
vi.mock('@tanstack/react-router', () => ({
    Link: ({ children }: any) => <a>{children}</a>,
    useNavigate: vi.fn(),

}));

describe('CreateGroupDialog', () => {
    const mockOnClose = vi.fn();
    const mockQueryClient = {
        invalidateQueries: vi.fn(),
    };
    const mockNavigate = vi.fn();
    const currentUserId = 'user-id';

    beforeEach(() => {
        vi.clearAllMocks();
        (useQueryClient as any).mockReturnValue(mockQueryClient);
        (useNavigate as any).mockReturnValue(mockNavigate);

        // Mock supabase chain
        const createMockChain = () => {
             const chain: any = {
                then: (resolve: any) => resolve({ data: [{ id: 'new-user', username: 'newuser', avatarUrl: 'new.png' }], error: null }),
             };
             
             chain.select = vi.fn().mockReturnValue(chain);
             chain.ilike = vi.fn().mockReturnValue(chain);
             chain.neq = vi.fn().mockReturnValue(chain);
             chain.limit = vi.fn().mockReturnValue(chain);
             
             return chain;
        };

        const chain = createMockChain();
        (supabase.from as any).mockReturnValue(chain);

        (chatService.createGroup as any).mockResolvedValue('new-chat-id');
    });

    it('renders dialog content', () => {
        render(<CreateGroupDialog open={true} onClose={mockOnClose} currentUserId={currentUserId} />);
        
        expect(screen.getByText('New Group Chat')).toBeInTheDocument();
        expect(screen.getByPlaceholderText('Enter crew name...')).toBeInTheDocument();
        expect(screen.getByPlaceholderText('Search by username...')).toBeInTheDocument();
    });

    it('searches for users', async () => {
        render(<CreateGroupDialog open={true} onClose={mockOnClose} currentUserId={currentUserId} />);

        const searchInput = screen.getByPlaceholderText('Search by username...');
        fireEvent.change(searchInput, { target: { value: 'new' } });

        await waitFor(() => {
            expect(supabase.from).toHaveBeenCalledWith('profiles');
            expect(screen.getByText('newuser')).toBeInTheDocument();
        });
    });

    it('creates a group', async () => {
        render(<CreateGroupDialog open={true} onClose={mockOnClose} currentUserId={currentUserId} />);

        // Set group name
        const nameInput = screen.getByPlaceholderText('Enter crew name...');
        fireEvent.change(nameInput, { target: { value: 'New Crew' } });

        // Search and select user
        const searchInput = screen.getByPlaceholderText('Search by username...');
        fireEvent.change(searchInput, { target: { value: 'new' } });

        await waitFor(() => screen.getByText('newuser'));
        
        const userItem = screen.getByText('newuser');
        fireEvent.click(userItem);

        // Click create button
        const createButton = screen.getByRole('button', { name: /Create Group/i });
        expect(createButton).not.toBeDisabled();
        fireEvent.click(createButton);

        await waitFor(() => {
            expect(chatService.createGroup).toHaveBeenCalledWith('New Crew', ['new-user'], currentUserId);
            expect(mockQueryClient.invalidateQueries).toHaveBeenCalledWith({ queryKey: ['chat', 'inbox'] });
            expect(mockNavigate).toHaveBeenCalledWith({ to: '/chat/$conversationId', params: { conversationId: 'new-chat-id' } });
            expect(mockOnClose).toHaveBeenCalled();
        });
    });

    it('disables create button when invalid', () => {
        render(<CreateGroupDialog open={true} onClose={mockOnClose} currentUserId={currentUserId} />);
        
        const createButton = screen.getByRole('button', { name: /Create Group/i });
        expect(createButton).toBeDisabled();

        // Only name provided
        const nameInput = screen.getByPlaceholderText('Enter crew name...');
        fireEvent.change(nameInput, { target: { value: 'New Crew' } });
        expect(createButton).toBeDisabled();
    });
});
