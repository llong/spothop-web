import { useState } from 'react';
import { Alert, Box, Button, CircularProgress, Paper, Stack, Typography } from '@mui/material';
import { adminService, type OrphanCleanupReport } from '@/services/adminService';

const formatBytes = (bytes: number) =>
    bytes >= 1024 * 1024 ? `${(bytes / 1024 / 1024).toFixed(1)} MB` : `${Math.max(1, Math.round(bytes / 1024))} KB`;

/**
 * Admin tool for orphaned media: files in the spot-media bucket that no spot references (left behind by
 * deleted spots, failed uploads, etc.). Always scan first; deleting is a separate, confirmed step.
 */
export function StorageCleanup() {
    const [report, setReport] = useState<OrphanCleanupReport | null>(null);
    const [deleted, setDeleted] = useState<OrphanCleanupReport | null>(null);
    const [busy, setBusy] = useState<'scan' | 'delete' | null>(null);
    const [error, setError] = useState<string | null>(null);

    const run = async (dryRun: boolean) => {
        setBusy(dryRun ? 'scan' : 'delete');
        setError(null);
        try {
            const result = await adminService.cleanupOrphanMedia(dryRun);
            if (dryRun) {
                setReport(result);
                setDeleted(null);
            } else {
                setDeleted(result);
                setReport(null);
            }
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Storage cleanup failed.');
        } finally {
            setBusy(null);
        }
    };

    const handleDelete = () => {
        if (!report) return;
        const ok = window.confirm(
            `Permanently delete ${report.orphanFiles} orphaned file(s) (${formatBytes(report.bytes)})? This cannot be undone.`
        );
        if (ok) run(false);
    };

    return (
        <Paper variant="outlined" sx={{ p: 3 }}>
            <Typography variant="h6" fontWeight={700} gutterBottom>Orphaned media</Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                Finds photos, videos and thumbnails in storage that no spot references, for example files left by
                deleted spots or failed uploads. Files uploaded in the last 24 hours are never touched. Scanning
                changes nothing.
            </Typography>

            {error && <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>{error}</Alert>}

            <Stack direction="row" spacing={1} alignItems="center">
                <Button variant="outlined" onClick={() => run(true)} disabled={busy !== null}>
                    {busy === 'scan' ? 'Scanning…' : 'Scan for orphaned files'}
                </Button>
                {report && report.orphanFiles > 0 && (
                    <Button variant="contained" color="error" onClick={handleDelete} disabled={busy !== null}>
                        {busy === 'delete' ? 'Deleting…' : `Delete ${report.orphanFiles} file(s)`}
                    </Button>
                )}
                {busy && <CircularProgress size={20} />}
            </Stack>

            {report && (
                <Box sx={{ mt: 2 }} data-testid="scan-result">
                    {report.orphanFiles === 0 ? (
                        <Alert severity="success">
                            No orphaned files found ({report.scannedFolders} spot folder(s) scanned).
                        </Alert>
                    ) : (
                        <Alert severity="warning">
                            Found {report.orphanFiles} orphaned file(s) using {formatBytes(report.bytes)}:{' '}
                            {report.orphanFolders} belong to deleted spots and {report.liveSpotsWithOrphans} live
                            spot(s) have unreferenced files. {report.skippedRecent > 0 &&
                                `${report.skippedRecent} recent file(s) were skipped.`}
                        </Alert>
                    )}
                </Box>
            )}

            {deleted && (
                <Alert severity="success" sx={{ mt: 2 }} data-testid="delete-result">
                    Deleted {deleted.removed} file(s), freeing about {formatBytes(deleted.bytes)}.
                </Alert>
            )}
        </Paper>
    );
}
