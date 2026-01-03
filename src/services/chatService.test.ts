import { describe, it, expect, vi, beforeEach } from 'vitest';
import { chatService } from './chatService';
import supabase from '../supabase';

// Mock Supabase
vi.mock('../supabase', () => ({
    default: {
        from: vi.fn(() => ({
            select: vi.fn().mockReturnThis(),
            eq: vi.fn().mockReturnThis(),
            neq: vi.fn().mockReturnThis(),
            in: vi.fn().mockReturnThis(),
            order: vi.fn().mockReturnThis(),
            insert: vi.fn().mockReturnThis(),
            single: vi.fn(),
        })),
        rpc: vi.fn(),
    }
}));

describe('chatService', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    describe('fetchMessages', () => {
        it('fetches and enriches messages with profiles', async () => {
            const mockMessages = [
                { id: 'm1', sender_id: 'user1', content: 'Hello' }
            ];
            const mockProfiles = [
                { id: 'user1', username: 'userone', avatarUrl: 'url1' }
            ];

            const mockFrom = supabase.from as any;
            mockFrom.mockImplementation((table: string) => {
                if (table === 'messages') {
                    return {
                        select: vi.fn().mockReturnThis(),
                        eq: vi.fn().mockReturnThis(),
                        order: vi.fn().mockResolvedValue({ data: mockMessages, error: null })
                    };
                }
                if (table === 'profiles') {
                    return {
                        select: vi.fn().mockReturnThis(),
                        in: vi.fn().mockResolvedValue({ data: mockProfiles, error: null })
                    };
                }
                return {};
            });

            const result = await chatService.fetchMessages('conv123');

            expect(result).toHaveLength(1);
            expect(result[0].author?.username).toBe('userone');
            expect(result[0].content).toBe('Hello');
        });
    });

    describe('sendMessage', () => {
        it('inserts a message and returns data', async () => {
            const mockMsg = { id: 'new', content: 'hi' };
            (supabase.from as any).mockReturnValue({
                insert: vi.fn().mockReturnThis(),
                select: vi.fn().mockReturnThis(),
                single: vi.fn().mockResolvedValue({ data: mockMsg, error: null })
            });

            const result = await chatService.sendMessage('c1', 'u1', 'hi');
            expect(result).toEqual(mockMsg);
        });
    });
});
