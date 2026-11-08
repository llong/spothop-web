import { describe, it, expect, vi, beforeEach } from 'vitest';
import { adminService } from '@/services/adminService';
import supabase from '@/supabase';

// Create a robust chain mock
const mockChain: any = {
    select: vi.fn().mockReturnThis(),
    delete: vi.fn().mockReturnThis(),
    update: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    in: vi.fn().mockReturnThis(),
    order: vi.fn().mockReturnThis(),
    or: vi.fn().mockReturnThis(),
    limit: vi.fn().mockReturnThis(),
    maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null }),
    single: vi.fn().mockResolvedValue({ data: null, error: null }),
    // Most supabase methods are thenable
    then: vi.fn(function (this: any, onFulfilled: (value: any) => any) {
        return Promise.resolve({ data: [], error: null }).then(onFulfilled);
    }),
};

vi.mock('@/supabase', () => ({
    default: {
        from: vi.fn(() => mockChain),
        functions: { invoke: vi.fn().mockResolvedValue({ data: { ok: true }, error: null }) },
        storage: {
            from: vi.fn(() => ({
                remove: vi.fn().mockResolvedValue({ error: null })
            }))
        }
    }
}));

describe('adminService', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        // Reset the default implementation for each test
        mockChain.then.mockImplementation(function (this: any, onFulfilled: (value: any) => any) {
            return Promise.resolve({ data: [], error: null }).then(onFulfilled);
        });
    });

    it('fetches reports successfully', async () => {
        const mockReports = [{ id: '1', reason: 'Spam', target_type: 'spot', target_id: 's1' }];

        mockChain.then.mockImplementationOnce(function (this: any, onFulfilled: (value: any) => any) {
            return Promise.resolve({ data: mockReports, error: null }).then(onFulfilled);
        });

        const result = await adminService.fetchReports();
        expect(result).toEqual([
            {
                ...mockReports[0],
                target_content: undefined,
                context_id: 's1'
            }
        ]);
        expect(supabase.from).toHaveBeenCalledWith('content_reports');
    });

    it('resolves a report by deleting it', async () => {
        mockChain.then.mockImplementationOnce(function (this: any, onFulfilled: (value: any) => any) {
            return Promise.resolve({ error: null }).then(onFulfilled);
        });

        await adminService.resolveReport('report-123');
        expect(supabase.from).toHaveBeenCalledWith('content_reports');
    });

    it('deletes a spot target through the delete-spot edge function', async () => {
        await adminService.deleteReportTarget('spot', 'spot-123');

        // The function removes every file for the spot (any uploader) and then the row
        expect((supabase as any).functions.invoke).toHaveBeenCalledWith('delete-spot', { body: { spotId: 'spot-123' } });
        expect(supabase.from).not.toHaveBeenCalledWith('spots');
    });

    it('toggles user ban', async () => {
        mockChain.then.mockImplementationOnce(function (this: any, onFulfilled: (value: any) => any) {
            return Promise.resolve({ error: null }).then(onFulfilled);
        });

        await adminService.toggleUserBan('user-123', true);
        expect(mockChain.update).toHaveBeenCalledWith({ "isBanned": true });
        expect(supabase.from).toHaveBeenCalledWith('profiles');
    });

    it('searches for users successfully', async () => {
        const mockUsers = [{ id: 'u1', username: 'testuser' }];
        mockChain.then.mockImplementationOnce(function (this: any, onFulfilled: (value: any) => any) {
            return Promise.resolve({ data: mockUsers, error: null }).then(onFulfilled);
        });

        const result = await adminService.searchUsers('test');
        expect(result).toEqual(mockUsers);
        expect(supabase.from).toHaveBeenCalledWith('profiles');
    });

    describe('cleanupOrphanMedia', () => {
        const invoke = () => vi.mocked((supabase as any).functions.invoke);
        const page = (over: Record<string, unknown>) => ({
            data: {
                scannedFolders: 0, orphanFolders: 0, liveSpotsWithOrphans: 0, orphanFiles: 0, bytes: 0,
                skippedRecent: 0, removed: 0, sample: [], nextOffset: null, ...over,
            },
            error: null,
        });

        it('pages through the function and sums the totals', async () => {
            invoke()
                .mockResolvedValueOnce(page({ scannedFolders: 100, orphanFolders: 2, orphanFiles: 10, bytes: 1000, sample: ['a'], nextOffset: 100 }))
                .mockResolvedValueOnce(page({ scannedFolders: 40, orphanFolders: 1, liveSpotsWithOrphans: 3, orphanFiles: 5, bytes: 500, skippedRecent: 2, sample: ['b'], nextOffset: null }));

            const report = await adminService.cleanupOrphanMedia(true);

            expect(invoke()).toHaveBeenNthCalledWith(1, 'cleanup-orphan-media', { body: { dryRun: true, offset: 0 } });
            expect(invoke()).toHaveBeenNthCalledWith(2, 'cleanup-orphan-media', { body: { dryRun: true, offset: 100 } });
            expect(report).toMatchObject({
                dryRun: true, scannedFolders: 140, orphanFolders: 3, liveSpotsWithOrphans: 3,
                orphanFiles: 15, bytes: 1500, skippedRecent: 2, sample: ['a', 'b'],
            });
        });

        it('passes dryRun=false through when deleting', async () => {
            invoke().mockResolvedValueOnce(page({ orphanFiles: 4, removed: 4, bytes: 400 }));

            const report = await adminService.cleanupOrphanMedia(false);

            expect(invoke()).toHaveBeenCalledWith('cleanup-orphan-media', { body: { dryRun: false, offset: 0 } });
            expect(report.removed).toBe(4);
        });

        it('explains when the edge function is not deployed', async () => {
            invoke().mockResolvedValueOnce({
                data: null,
                error: { message: 'x', context: new Response(JSON.stringify({ code: 'NOT_FOUND', message: 'Requested function was not found' }), { status: 404 }) },
            });

            await expect(adminService.cleanupOrphanMedia(true)).rejects.toThrow('not deployed yet');
        });

        it('surfaces the server message for other failures (e.g. not an admin)', async () => {
            invoke().mockResolvedValueOnce({
                data: null,
                error: { message: 'x', context: new Response(JSON.stringify({ error: 'Admin only' }), { status: 403 }) },
            });

            await expect(adminService.cleanupOrphanMedia(true)).rejects.toThrow('Admin only');
        });
    });
});