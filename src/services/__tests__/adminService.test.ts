import { describe, it, expect, vi, beforeEach } from 'vitest';
import { adminService } from '../adminService';
import supabase from '../../supabase';

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

vi.mock('../../supabase', () => ({
    default: {
        from: vi.fn(() => mockChain),
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

    it('deletes a spot target', async () => {
        // Setup for spot deletion which now fetches media first
        mockChain.then
            .mockImplementationOnce(function (this: any, onFulfilled: (value: any) => any) { return Promise.resolve({ data: [], error: null }).then(onFulfilled); }) // photos
            .mockImplementationOnce(function (this: any, onFulfilled: (value: any) => any) { return Promise.resolve({ data: [], error: null }).then(onFulfilled); }) // videos
            .mockImplementationOnce(function (this: any, onFulfilled: (value: any) => any) { return Promise.resolve({ data: [{ id: 'spot-123' }], error: null }).then(onFulfilled); }); // delete

        await adminService.deleteReportTarget('spot', 'spot-123');
        expect(supabase.from).toHaveBeenCalledWith('spots');
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
});