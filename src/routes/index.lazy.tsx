import { createLazyFileRoute } from '@tanstack/react-router';
import { Box, Grid, Typography, useTheme, useMediaQuery, CircularProgress } from "@mui/material";
import useSpots from 'src/hooks/useSpots';
import SpotsListCard from './-components/SpotsListCard';
import { useEffect, lazy, Suspense } from 'react';
import { useAtom, useSetAtom } from 'jotai';
import { getSpotsAtom, viewAtom } from 'src/atoms/map';
import { SpotListSkeleton } from './spots/-components/SpotCardSkeleton';
import { useOnlineStatus } from 'src/hooks/useOnlineStatus';

// Lazy load the Map component
const SpotMap = lazy(() => import('./-components/SpotMap'));

export const Route = createLazyFileRoute('/')({
    component: HomeComponent,
});

function HomeComponent() {
    const isOnline = useOnlineStatus();
    const { lat, lng } = Route.useSearch();
    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down('lg'));
    const [view] = useAtom(viewAtom);
    const { spots, getSpots, isLoading } = useSpots()
    const setGetSpotsAtom = useSetAtom(getSpotsAtom);

    useEffect(() => {
        setGetSpotsAtom(() => getSpots);
    }, [getSpots, setGetSpotsAtom]);

    // Force list view when offline
    const mapVisible = isOnline && (!isMobile || view === 'map');
    const listVisible = !isOnline || !isMobile || view === 'list';

    // When offline or in list view on desktop, adjust grid sizes
    const listGridSize = !isOnline ? 12 : (isMobile ? 12 : 4);
    const mapGridSize = isMobile ? 12 : 8;

    return (
        <Grid container spacing={0} sx={{ height: 'calc(100vh - 64px)', overflow: 'hidden' }}>
            {mapVisible && (
                <Grid size={{ xs: 12, lg: mapGridSize }} sx={{ height: '100%', p: 0, position: 'relative', overflow: 'hidden' }}>
                    <Suspense fallback={
                        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%', bgcolor: 'grey.100' }}>
                            <CircularProgress />
                        </Box>
                    }>
                        <SpotMap spots={spots} getSpots={getSpots} lat={lat} lng={lng} />
                    </Suspense>
                </Grid>
            )}
            {listVisible && (
                <Grid size={{ xs: 12, lg: listGridSize }} sx={{ height: '100%', overflowY: 'auto', p: 2, bgcolor: 'grey.100' }}>
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
    )
}
