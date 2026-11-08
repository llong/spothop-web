import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';

const cleanup = vi.hoisted(() => vi.fn());
vi.mock('@/services/adminService', () => ({ adminService: { cleanupOrphanMedia: cleanup } }));

import { StorageCleanup } from '@/routes/admin/-components/StorageCleanup';

const report = (over: Record<string, unknown> = {}) => ({
    dryRun: true, scannedFolders: 12, orphanFolders: 3, liveSpotsWithOrphans: 1,
    orphanFiles: 81, bytes: 26 * 1024 * 1024, skippedRecent: 0, removed: 0, sample: [], ...over,
});

describe('StorageCleanup', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('only scans (dry run) and offers deletion after finding orphans', async () => {
        cleanup.mockResolvedValue(report());
        render(<StorageCleanup />);
        expect(screen.queryByText(/Delete \d+ file/)).not.toBeInTheDocument();

        fireEvent.click(screen.getByText('Scan for orphaned files'));

        expect(await screen.findByText(/Found 81 orphaned file/)).toBeInTheDocument();
        expect(screen.getByText(/26\.0 MB/)).toBeInTheDocument();
        expect(cleanup).toHaveBeenCalledWith(true);
        expect(screen.getByText('Delete 81 file(s)')).toBeInTheDocument();
    });

    it('reports a clean bucket without offering deletion', async () => {
        cleanup.mockResolvedValue(report({ orphanFiles: 0, bytes: 0 }));
        render(<StorageCleanup />);

        fireEvent.click(screen.getByText('Scan for orphaned files'));

        expect(await screen.findByText(/No orphaned files found/)).toBeInTheDocument();
        expect(screen.queryByText(/Delete \d+ file/)).not.toBeInTheDocument();
    });

    it('does not delete if the admin cancels the confirmation', async () => {
        cleanup.mockResolvedValue(report());
        vi.spyOn(window, 'confirm').mockReturnValue(false);
        render(<StorageCleanup />);
        fireEvent.click(screen.getByText('Scan for orphaned files'));
        fireEvent.click(await screen.findByText('Delete 81 file(s)'));

        expect(window.confirm).toHaveBeenCalledWith(expect.stringContaining('81 orphaned file'));
        expect(cleanup).toHaveBeenCalledTimes(1); // only the scan
    });

    it('deletes after confirmation and reports the result', async () => {
        cleanup.mockResolvedValueOnce(report());
        cleanup.mockResolvedValueOnce(report({ dryRun: false, removed: 81 }));
        vi.spyOn(window, 'confirm').mockReturnValue(true);
        render(<StorageCleanup />);
        fireEvent.click(screen.getByText('Scan for orphaned files'));
        fireEvent.click(await screen.findByText('Delete 81 file(s)'));

        expect(await screen.findByTestId('delete-result')).toHaveTextContent('Deleted 81 file(s)');
        expect(cleanup).toHaveBeenLastCalledWith(false);
        // The stale scan result and delete button are gone: re-scan before deleting again
        await waitFor(() => expect(screen.queryByText(/Delete \d+ file/)).not.toBeInTheDocument());
    });

    it('shows the error when the cleanup fails', async () => {
        cleanup.mockRejectedValue(new Error('The cleanup-orphan-media Edge Function is not deployed yet.'));
        render(<StorageCleanup />);

        fireEvent.click(screen.getByText('Scan for orphaned files'));

        expect(await screen.findByText(/not deployed yet/)).toBeInTheDocument();
    });
});
