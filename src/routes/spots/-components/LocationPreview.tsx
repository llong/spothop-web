import { lazy, Suspense } from 'react';
import { Box, Paper, Skeleton } from '@mui/material';

// Lazy load the Leaflet portion to avoid bundling it in the main CSS/JS
const LocationPreviewContent = lazy(() => import('./LocationPreviewContent'));

interface LocationPreviewProps {
    lat: number;
    lng: number;
    address: string;
}

export const LocationPreview = (props: LocationPreviewProps) => {
    return (
        <Suspense fallback={
            <Paper elevation={2} sx={{ borderRadius: 2, overflow: 'hidden' }}>
                <Skeleton variant="rectangular" height={240} />
                <Box sx={{ p: 2 }}>
                    <Skeleton variant="text" width="60%" />
                    <Skeleton variant="text" width="80%" />
                    <Skeleton variant="text" width="40%" />
                </Box>
            </Paper>
        }>
            <LocationPreviewContent {...props} />
        </Suspense>
    );
};
