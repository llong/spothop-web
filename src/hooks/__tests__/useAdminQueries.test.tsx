import { renderHook, waitFor } from '@testing-library/react';
import { useAdminQueries } from '../useAdminQueries';
import { adminService } from '../../services/adminService';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

// Mock adminService
vi.mock('../../services/adminService', () => ({
    adminService: {
        fetchReports: vi.fn(),
        resolveReport: vi.fn(),
        deleteReportTarget: vi.fn(),
        toggleUserBan: vi.fn(),
        searchUsers: vi.fn(),
    }
}));

const createWrapper = () => {
    const queryClient = new QueryClient({
        defaultOptions: {
            queries: {
                retry: false,
            },
        },
    });
    return ({ children }: { children: React.ReactNode }) => (
        <QueryClientProvider client={queryClient}>
            {children}
        </QueryClientProvider>
    );
};

describe('useAdminQueries', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('fetches reports', async () => {
        const mockReports = [{ id: '1', reason: 'Spam' }];
        (adminService.fetchReports as any).mockResolvedValue(mockReports as any);

        const { result } = renderHook(() => useAdminQueries(), {
            wrapper: createWrapper()
        });

        await waitFor(() => expect(result.current.reports).toEqual(mockReports));
        expect(adminService.fetchReports).toHaveBeenCalled();
    });

    it('resolves a report', async () => {
        (adminService.resolveReport as any).mockResolvedValue(undefined);

        const { result } = renderHook(() => useAdminQueries(), {
            wrapper: createWrapper()
        });

        await result.current.resolveReport('report-123');
        expect(adminService.resolveReport).toHaveBeenCalledWith('report-123');
    });

    it('deletes content', async () => {
        (adminService.deleteReportTarget as any).mockResolvedValue(undefined);

        const { result } = renderHook(() => useAdminQueries(), {
            wrapper: createWrapper()
        });

        await result.current.deleteContent({ type: 'spot', id: 'spot-123' });
        expect(adminService.deleteReportTarget).toHaveBeenCalledWith('spot', 'spot-123');
    });

    it('toggles user ban', async () => {
        (adminService.toggleUserBan as any).mockResolvedValue(undefined);

        const { result } = renderHook(() => useAdminQueries(), {
            wrapper: createWrapper()
        });

        await result.current.toggleBan({ userId: 'u1', isBanned: true });
        expect(adminService.toggleUserBan).toHaveBeenCalledWith('u1', true);
    });
});
