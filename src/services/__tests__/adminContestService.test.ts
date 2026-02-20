import { describe, it, expect, vi, beforeEach } from 'vitest';
import { adminContestService } from '../adminContestService';
import supabase from '@/supabase';
import type { ContestStatus } from '@/types';

// Mock supabase
vi.mock('@/supabase', () => ({
    default: {
        from: vi.fn(),
        storage: {
            from: vi.fn(),
        },
    }
}));

describe('adminContestService', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    describe('fetchAllContests', () => {
        it('fetches all contests ordered by created_at', async () => {
            const mockContests = [{
                id: 'c1',
                title: 'Contest 1',
                description: 'Description 1',
                status: 'active' as ContestStatus,
                start_date: new Date().toISOString(),
                end_date: new Date().toISOString(),
                voting_type: 'public' as const,
                criteria: {}
            }];
            const mockFrom = vi.mocked(supabase.from);
            mockFrom.mockReturnValue({
                select: vi.fn().mockReturnThis(),
                order: vi.fn().mockResolvedValue({ data: mockContests, error: null })
            } as any);

            const result = await adminContestService.fetchAllContests();

            expect(result).toEqual(mockContests);
            expect(mockFrom).toHaveBeenCalledWith('contests');
        });
    });

    describe('createContest', () => {
        it('creates a contest without flyer file', async () => {
            const mockContest = {
                title: 'New Contest',
                description: 'New Contest Description',
                status: 'draft' as ContestStatus,
                start_date: new Date().toISOString(),
                end_date: new Date().toISOString(),
                voting_type: 'public' as const,
                criteria: {}
            };
            const mockFrom = vi.mocked(supabase.from);
            mockFrom.mockReturnValue({
                insert: vi.fn().mockReturnThis(),
                select: vi.fn().mockReturnThis(),
                single: vi.fn().mockResolvedValue({ data: { id: 'c1', ...mockContest }, error: null })
            } as any);

            const result = await adminContestService.createContest(mockContest);

            expect(result.id).toBe('c1');
            expect(result.title).toBe('New Contest');
            expect(mockFrom).toHaveBeenCalledWith('contests');
        });

        it('creates a contest with flyer file', async () => {
            const mockContest = {
                title: 'New Contest',
                description: 'New Contest Description',
                status: 'draft' as ContestStatus,
                start_date: new Date().toISOString(),
                end_date: new Date().toISOString(),
                voting_type: 'public' as const,
                criteria: {}
            };
            const mockFile = new File([''], 'flyer.jpg', { type: 'image/jpeg' });
            
            const mockStorage = vi.mocked(supabase.storage.from);
            mockStorage.mockReturnValue({
                upload: vi.fn().mockResolvedValue({ error: null }),
                getPublicUrl: vi.fn().mockReturnValue({ data: { publicUrl: 'public-url' } })
            } as any);

            const mockFrom = vi.mocked(supabase.from);
            mockFrom.mockReturnValue({
                insert: vi.fn().mockReturnThis(),
                select: vi.fn().mockReturnThis(),
                single: vi.fn().mockResolvedValue({ data: { id: 'c1', flyer_url: 'public-url' }, error: null })
            } as any);

            const result = await adminContestService.createContest(mockContest, mockFile);

            expect(result.flyer_url).toBe('public-url');
            expect(mockStorage).toHaveBeenCalledWith('spot-media');
        });
    });

    describe('updateContest', () => {
        it('updates a contest', async () => {
            const mockUpdates = {
                title: 'Updated Name',
                description: 'Updated Description',
                status: 'active' as ContestStatus,
                start_date: new Date().toISOString(),
                end_date: new Date().toISOString(),
                voting_type: 'judges' as const,
                criteria: {}
            };
            const mockFrom = vi.mocked(supabase.from);
            mockFrom.mockReturnValue({
                update: vi.fn().mockReturnThis(),
                eq: vi.fn().mockReturnThis(),
                select: vi.fn().mockReturnThis(),
                single: vi.fn().mockResolvedValue({ data: { id: 'c1', ...mockUpdates }, error: null })
            } as any);

            const result = await adminContestService.updateContest('c1', mockUpdates);

            expect(result.title).toBe('Updated Name');
            expect(mockFrom).toHaveBeenCalledWith('contests');
        });
    });

    describe('deleteContest', () => {
        it('deletes a contest', async () => {
            const mockFrom = vi.mocked(supabase.from);
            mockFrom.mockReturnValue({
                delete: vi.fn().mockReturnThis(),
                eq: vi.fn().mockReturnThis(),
                then: (cb: any) => Promise.resolve(cb({ error: null }))
            } as any);

            await adminContestService.deleteContest('c1');
            expect(mockFrom).toHaveBeenCalledWith('contests');
        });
    });

    describe('moderateEntry', () => {
        it('updates entry status', async () => {
            const mockFrom = vi.mocked(supabase.from);
            mockFrom.mockReturnValue({
                update: vi.fn().mockReturnThis(),
                eq: vi.fn().mockResolvedValue({ error: null })
            } as any);

            await adminContestService.moderateEntry('e1', 'approved');
            expect(mockFrom).toHaveBeenCalledWith('contest_entries');
        });
    });

    describe('uploadFlyer', () => {
        it('uploads file and returns public URL', async () => {
            const mockFile = new File([''], 'flyer.jpg', { type: 'image/jpeg' });
            const mockStorage = vi.mocked(supabase.storage.from);
            mockStorage.mockReturnValue({
                upload: vi.fn().mockResolvedValue({ error: null }),
                getPublicUrl: vi.fn().mockReturnValue({ data: { publicUrl: 'public-url' } })
            } as any);

            const result = await adminContestService.uploadFlyer(mockFile);

            expect(result).toBe('public-url');
            expect(mockStorage).toHaveBeenCalledWith('spot-media');
        });

        it('throws error on upload failure', async () => {
            const mockFile = new File([''], 'flyer.jpg', { type: 'image/jpeg' });
            const mockStorage = vi.mocked(supabase.storage.from);
            mockStorage.mockReturnValue({
                upload: vi.fn().mockResolvedValue({ error: new Error('Upload failed') }),
            } as any);

            await expect(adminContestService.uploadFlyer(mockFile)).rejects.toThrow('Upload failed');
        });
    });
});