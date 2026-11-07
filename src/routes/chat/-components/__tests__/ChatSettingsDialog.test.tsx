import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { ChatSettingsDialog } from '@/routes/chat/-components/ChatSettingsDialog';
import supabase from '@/supabase';
import { useQueryClient } from '@tanstack/react-query';
import { vi, describe, it, expect, beforeEach } from 'vitest';

// Mock dependencies
vi.mock('@/supabase', () => ({
    default: {
        from: vi.fn(),
    },
}));
vi.mock('@tanstack/react-query', async () => {
    const actual = await vi.importActual('@tanstack/react-query');
    return {
        ...actual,
        useQueryClient: vi.fn(),
    };
});

describe('ChatSettingsDialog', () => {
    const mockOnClose = vi.fn();
    const mockQueryClient = {
        invalidateQueries: vi.fn(),
    };
    const mockChat = {
        id: 'chat-id',
        is_group: true,
        name: 'Test Group',
        participants: [
            { id: '1', user_id: 'user-id', role: 'admin', status: 'accepted', profile: { displayName: 'Me', username: 'me' } },
            { id: '2', user_id: 'other-id', role: 'member', status: 'accepted', profile: { displayName: 'Other', username: 'other' } },
        ],
    } as any;
    const currentUserId = 'user-id';
    // Per-table results; tests override these to simulate RLS denials
    let tableResults: Record<string, { error: any; data: any[] }> = {};

    beforeEach(() => {
        vi.clearAllMocks();
        tableResults = {};
        (useQueryClient as any).mockReturnValue(mockQueryClient);
        
        // Mock supabase chain
        // const mockSelect = vi.fn().mockReturnThis();
        // const mockIlike = vi.fn().mockReturnThis();
        // const mockNeq = vi.fn().mockReturnThis();
        // const mockLimit = vi.fn().mockResolvedValue({ data: [{ id: 'new-user', username: 'newuser', avatarUrl: 'new.png' }] });
        // const mockInsert = vi.fn().mockResolvedValue({ error: null });
        // const mockUpdate = vi.fn().mockReturnThis();
        // const mockDelete = vi.fn().mockReturnThis();
        // Chainable, awaitable query builder. Mirrors supabase-js: errors are returned as { error } unless
        // .throwOnError() was chained, in which case the promise rejects.
        const createMockChain = (table: string) => {
             const result = tableResults[table] ?? { error: null, data: [{ id: 'new-user', username: 'newuser', avatarUrl: 'new.png' }] };
             let shouldThrow = false;
             const chain: any = {
                then: (resolve: any, reject: any) =>
                    (shouldThrow && result.error ? reject(result.error) : resolve(result)),
             };

             chain.throwOnError = vi.fn(() => { shouldThrow = true; return chain; });
             chain.select = vi.fn().mockReturnValue(chain);
             chain.ilike = vi.fn().mockReturnValue(chain);
             chain.neq = vi.fn().mockReturnValue(chain);
             chain.limit = vi.fn().mockReturnValue(chain);
             chain.insert = vi.fn().mockReturnValue(chain);
             chain.update = vi.fn().mockReturnValue(chain);
             chain.delete = vi.fn().mockReturnValue(chain);
             chain.eq = vi.fn().mockReturnValue(chain);
             
             return chain;
        };

        (supabase.from as any).mockImplementation((table: string) => createMockChain(table));
    });

    it('renders dialog content', () => {
        render(<ChatSettingsDialog open={true} onClose={mockOnClose} chat={mockChat} currentUserId={currentUserId} />);
        
        expect(screen.getByText('Chat Settings')).toBeInTheDocument();
        expect(screen.getByDisplayValue('Test Group')).toBeInTheDocument(); // Group name input
        expect(screen.getByText('Me')).toBeInTheDocument();
        expect(screen.getByText('Other')).toBeInTheDocument();
    });

    it('updates group name', async () => {
        render(<ChatSettingsDialog open={true} onClose={mockOnClose} chat={mockChat} currentUserId={currentUserId} />);

        const input = screen.getByDisplayValue('Test Group');
        fireEvent.change(input, { target: { value: 'New Group Name' } });
        
        const saveButton = screen.getByText('Save');
        fireEvent.click(saveButton);

        await waitFor(() => {
            expect(supabase.from).toHaveBeenCalledWith('conversations');
            // Check update call chain if possible, but basic invocation is good
            expect(mockQueryClient.invalidateQueries).toHaveBeenCalledWith({ queryKey: ['chat'] });
        });
    });

    it('searches for users', async () => {
        render(<ChatSettingsDialog open={true} onClose={mockOnClose} chat={mockChat} currentUserId={currentUserId} />);

        const searchInput = screen.getByPlaceholderText('Search by username...');
        fireEvent.change(searchInput, { target: { value: 'new' } });

        await waitFor(() => {
            expect(supabase.from).toHaveBeenCalledWith('profiles');
            expect(screen.getByText('newuser')).toBeInTheDocument();
        });
    });

    it('invites a user', async () => {
        render(<ChatSettingsDialog open={true} onClose={mockOnClose} chat={mockChat} currentUserId={currentUserId} />);

        // Search and find user first
        const searchInput = screen.getByPlaceholderText('Search by username...');
        fireEvent.change(searchInput, { target: { value: 'new' } });

        await waitFor(() => screen.getByText('newuser'));

        // Select user
        const userItem = screen.getByText('newuser');
        fireEvent.click(userItem);

        // Click invite button
        const inviteButton = screen.getByText(/Invitation\(s\)/);
        fireEvent.click(inviteButton);

        await waitFor(() => {
            expect(supabase.from).toHaveBeenCalledWith('conversation_participants');
            expect(mockQueryClient.invalidateQueries).toHaveBeenCalledWith({ queryKey: ['chat'] });
        });
    });

    it('removes a participant', async () => {
        vi.spyOn(window, 'confirm').mockReturnValue(true);
        render(<ChatSettingsDialog open={true} onClose={mockOnClose} chat={mockChat} currentUserId={currentUserId} />);

        // Find remove button for 'Other' user
        const removeButtons = screen.getAllByTestId('RemoveCircleOutlineIcon');
        const removeButton = removeButtons[0].closest('button');
        fireEvent.click(removeButton!);

        await waitFor(() => {
            expect(supabase.from).toHaveBeenCalledWith('conversation_participants');
            expect(mockQueryClient.invalidateQueries).toHaveBeenCalledWith({ queryKey: ['chat'] });
        });
    });

    describe('when the database refuses the change (RLS)', () => {
        it('shows an error and does not refresh when renaming affects 0 rows', async () => {
            tableResults.conversations = { error: null, data: [] };
            render(<ChatSettingsDialog open={true} onClose={mockOnClose} chat={mockChat} currentUserId={currentUserId} />);

            fireEvent.change(screen.getByDisplayValue('Test Group'), { target: { value: 'Nope' } });
            fireEvent.click(screen.getByText('Save'));

            expect(await screen.findByText(/Could not rename the group/)).toBeInTheDocument();
            expect(mockQueryClient.invalidateQueries).not.toHaveBeenCalled();
        });

        it('shows an error when removing a participant affects 0 rows', async () => {
            vi.spyOn(window, 'confirm').mockReturnValue(true);
            tableResults.conversation_participants = { error: null, data: [] };
            render(<ChatSettingsDialog open={true} onClose={mockOnClose} chat={mockChat} currentUserId={currentUserId} />);

            fireEvent.click(screen.getAllByTestId('RemoveCircleOutlineIcon')[0].closest('button')!);

            expect(await screen.findByText(/Could not remove that user/)).toBeInTheDocument();
            expect(mockQueryClient.invalidateQueries).not.toHaveBeenCalled();
        });

        it('shows an error when inviting is rejected', async () => {
            render(<ChatSettingsDialog open={true} onClose={mockOnClose} chat={mockChat} currentUserId={currentUserId} />);

            fireEvent.change(screen.getByPlaceholderText('Search by username...'), { target: { value: 'new' } });
            await waitFor(() => screen.getByText('newuser'));
            fireEvent.click(screen.getByText('newuser'));
            // From here on the participants table rejects the insert
            tableResults.conversation_participants = { error: { message: 'new row violates row-level security policy' }, data: [] };
            fireEvent.click(screen.getByText(/Invitation\(s\)/));

            expect(await screen.findByText(/Could not invite those users/)).toBeInTheDocument();
            expect(mockQueryClient.invalidateQueries).not.toHaveBeenCalled();
        });
    });
});
