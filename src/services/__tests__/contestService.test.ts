import { describe, it, expect, vi, beforeEach } from 'vitest';
import { contestService } from '../contestService';
import supabase from '@/supabase';

// Mock supabase
vi.mock('@/supabase', () => ({
    default: {
        from: vi.fn(),
        auth: {
            getSession: vi.fn(),
        },
    }
}));

describe('contestService', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    describe('fetchActiveContests', () => {
        it('fetches active contests with entry count', async () => {
            const mockContests = [
                { id: 'c1', name: 'Contest 1', status: 'active', start_date: '2023-01-01', entry_count: [{ count: 5 }] }
            ];

            const mockFrom = vi.mocked(supabase.from);
            mockFrom.mockReturnValue({
                select: vi.fn().mockReturnThis(),
                neq: vi.fn().mockReturnThis(),
                order: vi.fn().mockResolvedValue({ data: mockContests, error: null })
            } as any);

            const result = await contestService.fetchActiveContests();

            expect(result).toHaveLength(1);
            expect(result[0].entry_count).toBe(5);
            expect(mockFrom).toHaveBeenCalledWith('contests');
        });

        it('handles errors when fetching active contests', async () => {
            const mockFrom = vi.mocked(supabase.from);
            mockFrom.mockReturnValue({
                select: vi.fn().mockReturnThis(),
                neq: vi.fn().mockReturnThis(),
                order: vi.fn().mockResolvedValue({ data: null, error: new Error('Fetch failed') })
            } as any);

            await expect(contestService.fetchActiveContests()).rejects.toThrow('Fetch failed');
        });
    });

    describe('fetchContestById', () => {
        it('fetches a single contest by id', async () => {
            const mockContest = { id: 'c1', name: 'Contest 1' };
            const mockFrom = vi.mocked(supabase.from);
            mockFrom.mockReturnValue({
                select: vi.fn().mockReturnThis(),
                eq: vi.fn().mockReturnThis(),
                maybeSingle: vi.fn().mockResolvedValue({ data: mockContest, error: null })
            } as any);

            const result = await contestService.fetchContestById('c1');

            expect(result).toEqual(mockContest);
            expect(mockFrom).toHaveBeenCalledWith('contests');
        });
    });

    describe('fetchContestEntries', () => {
        it('fetches entries and enriches them with media URLs and vote counts', async () => {
            const mockEntries = [
                { id: 'e1', contest_id: 'c1', media_type: 'photo', media_id: 'p1' },
                { id: 'e2', contest_id: 'c1', media_type: 'video', media_id: 'v1' }
            ];

            const mockFrom = vi.mocked(supabase.from);
            mockFrom.mockImplementation((table: string) => {
                if (table === 'contest_entries') {
                    return {
                        select: vi.fn().mockReturnThis(),
                        eq: vi.fn().mockReturnThis(),
                        neq: vi.fn().mockReturnThis(),
                        order: vi.fn().mockResolvedValue({ data: mockEntries, error: null })
                    } as any;
                }
                if (table === 'spot_photos') {
                    return {
                        select: vi.fn().mockReturnThis(),
                        in: vi.fn().mockResolvedValue({ data: [{ id: 'p1', url: 'photo-url' }], error: null })
                    } as any;
                }
                if (table === 'spot_videos') {
                    return {
                        select: vi.fn().mockReturnThis(),
                        in: vi.fn().mockResolvedValue({ data: [{ id: 'v1', url: 'video-url' }], error: null })
                    } as any;
                }
                if (table === 'contest_votes') {
                    return {
                        select: vi.fn().mockReturnThis(),
                        in: vi.fn().mockResolvedValue({ data: [{ entry_id: 'e1' }, { entry_id: 'e1' }], error: null })
                    } as any;
                }
                return {} as any;
            });

            const result = await contestService.fetchContestEntries('c1');

            expect(result).toHaveLength(2);
            expect(result[0].media_url).toBe('photo-url');
            expect(result[0].vote_count).toBe(2);
            expect(result[1].media_url).toBe('video-url');
            expect(result[1].vote_count).toBe(0);
        });

        it('returns empty array when no entries found', async () => {
            const mockFrom = vi.mocked(supabase.from);
            mockFrom.mockReturnValue({
                select: vi.fn().mockReturnThis(),
                eq: vi.fn().mockReturnThis(),
                neq: vi.fn().mockReturnThis(),
                order: vi.fn().mockResolvedValue({ data: [], error: null })
            } as any);

            const result = await contestService.fetchContestEntries('c1');
            expect(result).toEqual([]);
        });
    });

    describe('submitEntry', () => {
        it('submits a new entry successfully', async () => {
            const mockSession = { user: { id: 'u1' } };
            vi.mocked(supabase.auth.getSession).mockResolvedValue({ data: { session: mockSession }, error: null } as any);
            
            const mockFrom = vi.mocked(supabase.from);
            mockFrom.mockImplementation((table: string) => {
                if (table === 'contests') {
                    return {
                        select: vi.fn().mockReturnThis(),
                        eq: vi.fn().mockReturnThis(),
                        maybeSingle: vi.fn().mockResolvedValue({ data: { criteria: {} }, error: null })
                    } as any;
                }
                if (table === 'contest_entries') {
                    return {
                        insert: vi.fn().mockResolvedValue({ error: null })
                    } as any;
                }
                return {} as any;
            });

            await contestService.submitEntry('c1', 's1', 'photo', 'p1');

            expect(mockFrom).toHaveBeenCalledWith('contest_entries');
        });

        it('throws error if not authenticated', async () => {
            vi.mocked(supabase.auth.getSession).mockResolvedValue({ data: { session: null }, error: null } as any);
            await expect(contestService.submitEntry('c1', 's1', 'photo', 'p1')).rejects.toThrow('Authentication required');
        });

        it('throws error if max entries reached', async () => {
            const mockSession = { user: { id: 'u1' } };
            vi.mocked(supabase.auth.getSession).mockResolvedValue({ data: { session: mockSession }, error: null } as any);

            const mockFrom = vi.mocked(supabase.from);
            mockFrom.mockImplementation((table: string) => {
                if (table === 'contests') {
                    return {
                        select: vi.fn().mockReturnThis(),
                        eq: vi.fn().mockReturnThis(),
                        maybeSingle: vi.fn().mockResolvedValue({ data: { criteria: { max_entries_per_user: 1 } }, error: null })
                    } as any;
                }
                if (table === 'contest_entries') {
                    return {
                        select: vi.fn().mockReturnThis(),
                        eq: vi.fn().mockReturnThis(),
                        // Mocking count return
                        then: (cb: any) => Promise.resolve(cb({ count: 1, error: null }))
                    } as any;
                }
                return {} as any;
            });

            await expect(contestService.submitEntry('c1', 's1', 'photo', 'p1')).rejects.toThrow('Maximum entries reached (1)');
        });
    });

    describe('voteForEntry', () => {
        it('casts a vote successfully', async () => {
            const mockSession = { user: { id: 'u1' } };
            vi.mocked(supabase.auth.getSession).mockResolvedValue({ data: { session: mockSession }, error: null } as any);

            const mockFrom = vi.mocked(supabase.from);
            mockFrom.mockImplementation((table: string) => {
                if (table === 'contests') {
                    return {
                        select: vi.fn().mockReturnThis(),
                        eq: vi.fn().mockReturnThis(),
                        maybeSingle: vi.fn().mockResolvedValue({ data: { criteria: {} }, error: null })
                    } as any;
                }
                if (table === 'contest_votes') {
                    return {
                        delete: vi.fn().mockReturnThis(),
                        eq: vi.fn().mockReturnThis(),
                        insert: vi.fn().mockResolvedValue({ error: null }),
                        // Handle the delete call
                        then: (cb: any) => Promise.resolve(cb({ error: null }))
                    } as any;
                }
                return {} as any;
            });

            await contestService.voteForEntry('c1', 'e1');
            expect(mockFrom).toHaveBeenCalledWith('contest_votes');
        });

        it('throws error if rider type not allowed', async () => {
            const mockSession = { user: { id: 'u1' } };
            vi.mocked(supabase.auth.getSession).mockResolvedValue({ data: { session: mockSession }, error: null } as any);

            const mockFrom = vi.mocked(supabase.from);
            mockFrom.mockImplementation((table: string) => {
                if (table === 'contests') {
                    return {
                        select: vi.fn().mockReturnThis(),
                        eq: vi.fn().mockReturnThis(),
                        maybeSingle: vi.fn().mockResolvedValue({ data: { criteria: { allowed_rider_types: ['Pro'] } }, error: null })
                    } as any;
                }
                if (table === 'profiles') {
                    return {
                        select: vi.fn().mockReturnThis(),
                        eq: vi.fn().mockReturnThis(),
                        single: vi.fn().mockResolvedValue({ data: { riderType: 'Am' }, error: null })
                    } as any;
                }
                return {} as any;
            });

            await expect(contestService.voteForEntry('c1', 'e1')).rejects.toThrow('Only Pro can vote in this contest');
        });
    });

    describe('removeVote', () => {
        it('removes a vote successfully', async () => {
            vi.mocked(supabase.auth.getSession).mockResolvedValue({ data: { session: { user: { id: 'u1' } } }, error: null } as any);
            const mockFrom = vi.mocked(supabase.from);
            mockFrom.mockReturnValue({
                delete: vi.fn().mockReturnThis(),
                eq: vi.fn().mockReturnThis(),
                then: (cb: any) => Promise.resolve(cb({ error: null }))
            } as any);

            await contestService.removeVote('e1');
            expect(mockFrom).toHaveBeenCalledWith('contest_votes');
        });
    });

    describe('hasUserVoted', () => {
        it('returns true if user has voted', async () => {
            const mockFrom = vi.mocked(supabase.from);
            mockFrom.mockReturnValue({
                select: vi.fn().mockReturnThis(),
                eq: vi.fn().mockReturnThis(),
                maybeSingle: vi.fn().mockResolvedValue({ data: { id: 'v1' }, error: null })
            } as any);

            const result = await contestService.hasUserVoted('e1', 'u1');
            expect(result).toBe(true);
        });

        it('returns false if user has not voted', async () => {
            const mockFrom = vi.mocked(supabase.from);
            mockFrom.mockReturnValue({
                select: vi.fn().mockReturnThis(),
                eq: vi.fn().mockReturnThis(),
                maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null })
            } as any);

            const result = await contestService.hasUserVoted('e1', 'u1');
            expect(result).toBe(false);
        });
    });

    describe('retractEntry', () => {
        it('deletes entry successfully', async () => {
            vi.mocked(supabase.auth.getSession).mockResolvedValue({ data: { session: { user: { id: 'u1' } } }, error: null } as any);
            const mockFrom = vi.mocked(supabase.from);
            mockFrom.mockReturnValue({
                delete: vi.fn().mockReturnThis(),
                eq: vi.fn().mockReturnThis(),
                then: (cb: any) => Promise.resolve(cb({ error: null }))
            } as any);

            await contestService.retractEntry('e1');
            expect(mockFrom).toHaveBeenCalledWith('contest_entries');
        });
    });
});
