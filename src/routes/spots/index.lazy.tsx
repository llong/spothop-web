import { createLazyFileRoute } from '@tanstack/react-router';
import { Box, Grid, Typography, useTheme, useMediaQuery, CircularProgress, Drawer, IconButton } from "@mui/material";
import CloseIcon from '@mui/icons-material/Close';
import useSpots from 'src/hooks/useSpots';
import SpotsListCard from '../-components/SpotsListCard';
import { useEffect, lazy, Suspense, useState } from 'react';
import { useAtom, useSetAtom } from 'jotai';
import { getSpotsAtom, viewAtom } from 'src/atoms/map';
import { SpotListSkeleton } from './-components/SpotCardSkeleton';
import { useOnlineStatus } from 'src/hooks/useOnlineStatus';
import type { Spot } from 'src/types';

// Lazy load the Map component
const SpotMap = lazy(() => import('../-components/SpotMap').then(m => ({ default: m.SpotMap })));

export const Route = createLazyFileRoute('/spots/')({
    component: SpotsIndex,
});

function SpotsIndex() {
    const isOnline = useOnlineStatus();
    const { lat, lng } = Route.useSearch();
    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down('lg'));
    const [view] = useAtom(viewAtom);
    const { spots, getSpots, isLoading } = useSpots()
    const setGetSpotsAtom = useSetAtom(getSpotsAtom);

    // Overlay state
    const [selectedSpot, setSelectedSpot] = useState<Spot | null>(null);

    useEffect(() => {
        setGetSpotsAtom(() => getSpots);
    }, [getSpots, setGetSpotsAtom]);

    const handleSpotClick = (spot: Spot) => {
        setSelectedSpot(spot);
    };

    const handleCloseOverlay = () => {
        setSelectedSpot(null);
    };

    // Force list view when offline
    const mapVisible = isOnline && (!isMobile || view === 'map');
    const listVisible = !isOnline || !isMobile || view === 'list';

    // When offline or in list view on desktop, adjust grid sizes
    const listGridSize = !isOnline ? 12 : (isMobile ? 12 : 4);
    const mapGridSize = isMobile ? 12 : 8;

    return (
        <Box sx={{ height: 'calc(100vh - 64px)', overflow: 'hidden', position: 'relative' }}>
            <Grid container spacing={0} sx={{ height: '100%' }}>
                {mapVisible && (
                    <Grid size={{ xs: 12, lg: mapGridSize }} sx={{ height: '100%', p: 0, position: 'relative', overflow: 'hidden' }}>
                        <Suspense fallback={
                            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%', bgcolor: 'grey.100' }}>
                                <CircularProgress />
                            </Box>
                        }>
                            <SpotMap
                                spots={spots}
                                getSpots={getSpots}
                                onSpotClick={handleSpotClick}
                                lat={lat}
                                lng={lng}
                            />
                        </Suspense>
                    </Grid>
                )}
                {listVisible && (
                    <Grid size={{ xs: 12, lg: listGridSize }} sx={{ height: '100%', overflowY: 'auto', p: 2, bgcolor: 'grey.100', position: 'relative' }}>
                        <Typography variant="h4" component="h1" sx={{ mb: 2, fontWeight: 800 }}>Spots</Typography>
                        {isLoading ? (
                            <SpotListSkeleton />
                        ) : (
                            <Grid container spacing={2}>
                                {spots.length > 0 ? (
                                    spots.map((spot, index) => (
                                        <Grid size={{ xs: 12, lg: 6 }} key={spot.id}>
                                            <SpotsListCard spot={spot} priority={index === 0} />
                                        </Grid>
                                    ))
                                ) : (
                                    <Grid size={12}>
                                        <Typography color="text.secondary" sx={{ textAlign: 'center', mt: 4 }}>
                                            No spots found in this area.
                                        </Typography>
                                    </Grid>
                                )}
                            </Grid>
                        )}
                    </Grid>
                )}
            </Grid>

            {/* Spot Overlay (Drawer for mobile, or floating card for desktop) */}
            <Drawer
                anchor={isMobile ? "bottom" : "right"}
                open={!!selectedSpot}
                onClose={handleCloseOverlay}
                PaperProps={{
                    sx: {
                        width: isMobile ? '100%' : 400,
                        height: isMobile ? 'auto' : '100%',
                        maxHeight: isMobile ? '80vh' : '100%',
                        p: 0,
                        bgcolor: 'background.paper',
                        borderRadius: isMobile ? '20px 20px 0 0' : 0
                    }
                }}
            >
                {selectedSpot && (
                    <Box sx={{ height: '100%', position: 'relative', pt: 6 }}>
                        <IconButton
                            onClick={handleCloseOverlay}
                            sx={{ position: 'absolute', top: 8, right: 8, zIndex: 1 }}
                        >
                            <CloseIcon />
                        </IconButton>
                        <Box sx={{ height: '100%', overflowY: 'auto', p: 2 }}>
                            <SpotsListCard spot={selectedSpot} priority />
                        </Box>
                    </Box>
                )}
            </Drawer>
        </Box>
    )
}
