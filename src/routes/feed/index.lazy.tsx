import { createLazyFileRoute, Link } from '@tanstack/react-router';
import {
    Box,
    Container,
    Typography,
    CircularProgress,
    Button,
    Stack,
    Paper,
    Drawer,
    IconButton,
} from '@mui/material';
import { useFeedQuery } from 'src/hooks/useFeedQueries';
import { FeedItemCard } from './-components/FeedItem';
import { FeedItemSkeleton } from './-components/FeedItemSkeleton';
import { useAtomValue } from 'jotai';
import { userAtom } from 'src/atoms/auth';
import { userLocationAtom } from 'src/atoms/map';
import { useRef, useCallback, useState, useMemo } from 'react';
import AddLocationIcon from '@mui/icons-material/AddLocation';
import FilterListIcon from '@mui/icons-material/FilterList';
import { FeedFilterPanel } from './-components/FeedFilterPanel';

export const Route = createLazyFileRoute('/feed/')({
    component: FeedScreen,
});

interface FeedFilters {
    nearMe: boolean;
    maxDistKm: number;
    followingOnly: boolean;
    spotTypes: string[];
    difficulties: string[];
    riderTypes: string[];
    maxRisk: number;
}

const INITIAL_FILTERS: FeedFilters = {
    nearMe: false,
    maxDistKm: 50,
    followingOnly: false,
    spotTypes: [],
    difficulties: [],
    riderTypes: [],
    maxRisk: 5,
};

export function FeedScreen() {
    const user = useAtomValue(userAtom);
    const userLocation = useAtomValue(userLocationAtom);
    const [filterDrawerOpen, setFilterDrawerOpen] = useState(false);
    const [filters, setFilters] = useState<FeedFilters>(INITIAL_FILTERS);

    const hasActiveFilters = useMemo(() => {
        return filters.nearMe || 
               filters.followingOnly || 
               filters.spotTypes.length > 0 || 
               filters.difficulties.length > 0 || 
               filters.riderTypes.length > 0 ||
               filters.maxRisk < 5;
    }, [filters]);

    const queryFilters = useMemo(() => ({
        lat: filters.nearMe ? userLocation?.latitude : undefined,
        lng: filters.nearMe ? userLocation?.longitude : undefined,
        maxDistKm: filters.nearMe ? filters.maxDistKm : undefined,
        followingOnly: filters.followingOnly,
        spotTypes: filters.spotTypes.length > 0 ? filters.spotTypes : undefined,
        difficulties: filters.difficulties.length > 0 ? filters.difficulties : undefined,
        riderTypes: filters.riderTypes.length > 0 ? filters.riderTypes : undefined,
        maxRisk: filters.maxRisk < 5 ? filters.maxRisk : undefined,
    }), [filters, userLocation]);

    const {
        data,
        fetchNextPage,
        hasNextPage,
        isFetchingNextPage,
        isLoading,
        error
    } = useFeedQuery(user?.user.id, 10, queryFilters);

    const observer = useRef<IntersectionObserver | null>(null);
    const lastElementRef = useCallback((node: HTMLDivElement | null) => {
        if (isLoading) return;
        if (observer.current) observer.current.disconnect();
        observer.current = new IntersectionObserver(entries => {
            if (entries[0].isIntersecting && hasNextPage) {
                fetchNextPage();
            }
        });
        if (node) observer.current.observe(node);
    }, [isLoading, hasNextPage, fetchNextPage]);

    if (isLoading) {
        return (
            <Box sx={{ py: 4, bgcolor: 'grey.50', minHeight: '100vh' }}>
                <Container maxWidth="sm">
                    <Typography variant="h4" fontWeight={900} sx={{ mb: 4, px: 2 }}>
                        Global Feed
                    </Typography>
                    <Stack spacing={0}>
                        {[...Array(3)].map((_, i) => (
                            <FeedItemSkeleton key={i} />
                        ))}
                    </Stack>
                </Container>
            </Box>
        );
    }

    if (error) {
        return (
            <Container maxWidth="sm" sx={{ py: 8 }}>
                <Paper sx={{ p: 4, textAlign: 'center', borderRadius: 4 }}>
                    <Typography color="error" gutterBottom>Failed to load feed</Typography>
                    <Button variant="contained" onClick={() => window.location.reload()}>Retry</Button>
                </Paper>
            </Container>
        );
    }

    const allItems = data?.pages.flat() || [];

    if (allItems.length === 0) {
        return (
            <Container maxWidth="sm" sx={{ py: 8 }}>
                <Paper sx={{ p: 4, textAlign: 'center', borderRadius: 4, border: '2px dashed', borderColor: 'grey.300', bgcolor: 'grey.50' }}>
                    {hasActiveFilters ? (
                        <>
                            <FilterListIcon sx={{ fontSize: 64, color: 'grey.400', mb: 2 }} />
                            <Typography variant="h5" fontWeight={700} gutterBottom>No matches found</Typography>
                            <Typography variant="body1" color="text.secondary" sx={{ mb: 4 }}>
                                We couldn't find any spots matching your current filters. Try using broader settings to see more content.
                            </Typography>
                            <Button 
                                variant="contained" 
                                size="large" 
                                onClick={() => setFilters(INITIAL_FILTERS)}
                                sx={{ borderRadius: 10 }}
                            >
                                Clear All Filters
                            </Button>
                        </>
                    ) : (
                        <>
                            <AddLocationIcon sx={{ fontSize: 64, color: 'grey.400', mb: 2 }} />
                            <Typography variant="h5" fontWeight={700} gutterBottom>No spots yet!</Typography>
                            <Typography variant="body1" color="text.secondary" sx={{ mb: 4 }}>
                                The global feed is currently empty. Be the first to share a skate spot with the community!
                            </Typography>
                            <Stack spacing={2}>
                                <Typography variant="subtitle2" fontWeight={700}>Quick Tutorial:</Typography>
                                <Typography variant="body2">1. Go to the Spots page</Typography>
                                <Typography variant="body2">2. Long press on the map</Typography>
                                <Typography variant="body2">3. Add details and media</Typography>
                                <Link to="/" search={{}}>
                                    <Button variant="contained" size="large" sx={{ mt: 2, borderRadius: 10 }}>
                                        Go to Spots Map
                                    </Button>
                                </Link>
                            </Stack>
                        </>
                    )}
                </Paper>
            </Container>
        );
    }

    return (
        <Box sx={{ py: 4, bgcolor: 'grey.50', minHeight: '100vh' }}>
            <Container maxWidth="sm">
                <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 4, px: 2 }}>
                    <Typography variant="h4" fontWeight={900}>
                        Global Feed
                    </Typography>
                    <IconButton
                        onClick={() => setFilterDrawerOpen(true)}
                        color={hasActiveFilters ? "primary" : "default"}
                        sx={{ 
                            bgcolor: hasActiveFilters ? 'primary.light' : 'transparent',
                            '&:hover': { bgcolor: hasActiveFilters ? 'primary.light' : 'grey.200' }
                        }}
                    >
                        <FilterListIcon />
                    </IconButton>
                </Stack>

                {allItems.map((item, index) => (
                    <div
                        key={`${item.media_id}-${index}`}
                        ref={index === allItems.length - 1 ? lastElementRef : null}
                    >
                        <FeedItemCard
                            item={item}
                            currentUserId={user?.user.id}
                        />
                    </div>
                ))}

                {isFetchingNextPage && (
                    <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
                        <CircularProgress size={32} />
                    </Box>
                )}

                {!hasNextPage && allItems.length > 0 && (
                    <Typography variant="body2" color="text.secondary" align="center" sx={{ py: 8 }}>
                        You've reached the end of the global feed.
                    </Typography>
                )}
            </Container>

            <Drawer
                anchor="bottom"
                open={filterDrawerOpen}
                onClose={() => setFilterDrawerOpen(false)}
                PaperProps={{
                    sx: { borderRadius: '20px 20px 0 0' }
                }}
            >
                <FeedFilterPanel
                    filters={filters}
                    onApply={(newFilters) => {
                        setFilters(newFilters);
                        setFilterDrawerOpen(false);
                    }}
                    onClose={() => setFilterDrawerOpen(false)}
                />
            </Drawer>
        </Box>
    );
}
