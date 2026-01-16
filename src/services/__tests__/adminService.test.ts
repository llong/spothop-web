import { describe, it, expect, vi, beforeEach } from 'vitest';
import { adminService } from '../adminService';
import supabase from '../../supabase';

vi.mock('../../supabase', () => ({
    default: {
        from: vi.fn(() => ({
            select: vi.fn().mockReturnThis(),
            delete: vi.fn().mockReturnThis(),
            update: vi.fn().mockReturnThis(),
            eq: vi.fn().mockReturnThis(),
            order: vi.fn().mockReturnThis(),
            or: vi.fn().mockReturnThis(),
            limit: vi.fn().mockReturnThis(),
            maybeSingle: vi.fn(),
            single: vi.fn(),
        }))
    }
}));

describe('adminService', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('fetches reports successfully', async () => {
        const mockReports = [{ id: '1', reason: 'Spam', target_type: 'spot', target_id: 's1' }];
        const mockSelect = vi.fn().mockReturnThis();
        const mockOrder = vi.fn().mockResolvedValue({ data: mockReports, error: null });

        (supabase.from as any).mockReturnValue({
            select: mockSelect,
            order: mockOrder,
            in: vi.fn().mockResolvedValue({ data: [], error: null })
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
        const mockEq = vi.fn().mockResolvedValue({ error: null });
        (supabase.from as any).mockReturnValue({
            delete: vi.fn().mockReturnThis(),
            eq: mockEq
        });

        await adminService.resolveReport('report-123');
        expect(supabase.from).toHaveBeenCalledWith('content_reports');
    });

    it('deletes a spot target', async () => {
        const mockEq = vi.fn().mockResolvedValue({ error: null });
        (supabase.from as any).mockReturnValue({
            delete: vi.fn().mockReturnThis(),
            eq: mockEq
        });

        await adminService.deleteReportTarget('spot', 'spot-123');
        expect(supabase.from).toHaveBeenCalledWith('spots');
    });

    it('toggles user ban', async () => {
        const mockEq = vi.fn().mockResolvedValue({ error: null });
        const mockUpdate = vi.fn().mockReturnThis();
        (supabase.from as any).mockReturnValue({
            update: mockUpdate,
            eq: mockEq
        });

        await adminService.toggleUserBan('user-123', true);
        expect(mockUpdate).toHaveBeenCalledWith({ "isBanned": true });
        expect(supabase.from).toHaveBeenCalledWith('profiles');
    });

    it('searches for users successfully', async () => {
        const mockUsers = [{ id: 'u1', username: 'testuser' }];
        const mockOr = vi.fn().mockReturnThis();
        const mockLimit = vi.fn().mockResolvedValue({ data: mockUsers, error: null });

        (supabase.from as any).mockReturnValue({
            select: vi.fn().mockReturnThis(),
            or: mockOr,
            limit: mockLimit
        });

        const result = await adminService.searchUsers('test');
        expect(result).toEqual(mockUsers);
        expect(supabase.from).toHaveBeenCalledWith('profiles');
    });
});
