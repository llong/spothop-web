import { useState } from 'react';
import { Alert, Button, CircularProgress, LinearProgress, Paper, Stack, Typography } from '@mui/material';
import { adminService } from '@/services/adminService';

/** Admin tool: creates the map-pin thumbnail for photos uploaded before pins existed. Safe to run repeatedly. */
export function PinThumbnailBackfill() {
    const [progress, setProgress] = useState<{ done: number; total: number } | null>(null);
    const [result, setResult] = useState<{ total: number; done: number; failed: number } | null>(null);
    const [running, setRunning] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const run = async () => {
        setRunning(true);
        setError(null);
        setResult(null);
        try {
            setResult(await adminService.backfillPinThumbnails((done, total) => setProgress({ done, total })));
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Backfill failed.');
        } finally {
            setRunning(false);
            setProgress(null);
        }
    };

    return (
        <Paper variant="outlined" sx={{ p: 3, mt: 3 }}>
            <Typography variant="h6" fontWeight={700} gutterBottom>Map pin thumbnails</Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                Creates the small photo used as the map pin for photos uploaded before pins existed. Only photos
                without one are processed, so it is safe to run again.
            </Typography>

            {error && <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>{error}</Alert>}

            <Stack direction="row" spacing={1} alignItems="center">
                <Button variant="outlined" onClick={run} disabled={running}>
                    {running ? 'Working…' : 'Create missing pin thumbnails'}
                </Button>
                {running && <CircularProgress size={20} />}
            </Stack>

            {progress && <LinearProgress variant="determinate" value={(progress.done / progress.total) * 100} sx={{ mt: 2 }} />}
            {result && (
                <Alert severity={result.failed ? 'warning' : 'success'} sx={{ mt: 2 }} data-testid="backfill-result">
                    {result.total === 0
                        ? 'Every photo already has a pin thumbnail.'
                        : `Created ${result.done} of ${result.total} pin thumbnail(s)${result.failed ? `, ${result.failed} failed (see the console)` : ''}.`}
                </Alert>
            )}
        </Paper>
    );
}
