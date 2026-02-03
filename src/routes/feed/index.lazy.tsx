import { createLazyFileRoute } from '@tanstack/react-router';
import {
    Box,
    Container,
    Typography,
    Button,
    Stack,
    Drawer,
    Tabs,
    Tab,
    Avatar,
    Chip,
} from '@mui/material';
import { Link as RouterLink } from '@tanstack/react-router';
import { useFeedQuery, useFollowingFeedQuery } from 'src/hooks/useFeedQueries';
import { useConstructFeedFilters } from 'src/hooks/useConstructFeedFilters';
import { useAtomValue, useAtom } from 'jotai';
import { userAtom } from 'src/atoms/auth';
import { userLocationAtom } from 'src/atoms/map';
import { useQueryClient } from '@tanstack/react-query';
import { feedFiltersAtom, INITIAL_FEED_FILTERS } from 'src/atoms/feed';
import { useRef, useCallback, useState, useMemo } from 'react';
import FilterListIcon from '@mui/icons-material/FilterList';
import { FeedFilterPanel } from './-components/FeedFilterPanel';
import { FeedContent } from './-components/FeedContent';

export const Route = createLazyFileRoute('/feed/')({
    component: FeedScreen,
});

export function FeedScreen() {
    const queryClient = useQueryClient();
    const user = useAtomValue(userAtom);
    console.log('[FeedScreen] Render. User:', user?.user?.id);
    const userLocation = useAtomValue(userLocationAtom);
    const [filterDrawerOpen, setFilterDrawerOpen] = useState(false);
    const [activeTab, setActiveTab] = useState(0);
    const [filters, setFilters] = useAtom(feedFiltersAtom);

    const hasActiveFilters = useMemo(() => {
        return filters.nearMe ||
            filters.spotTypes.length > 0 ||
            filters.difficulties.length > 0 ||
            filters.riderTypes.length > 0 ||
            filters.maxRisk < 5 ||
            !!filters.author ||
            !!filters.selectedLocation;
    }, [filters]);

    return (
        <Box sx={{ bgcolor: 'background.paper', minHeight: '100vh' }}>
            <Box sx={{
                position: 'sticky',
                top: 0,
                zIndex: 1100,
                bgcolor: 'rgba(255, 255, 255, 0.85)',
                backdropFilter: 'blur(12px)',
                borderBottom: '1px solid',
                borderColor: 'divider'
            }}>
                <Container maxWidth="sm" sx={{ px: 0 }}>
                    <Box sx={{ pt: 2, px: 2, display: { lg: 'none' } }}>
                        <Typography variant="h5" fontWeight={900}>
                            SpotHop
                        </Typography>
                    </Box>
                    
                    <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ py: 1, px: 2 }}>
                        <Typography variant="h6" sx={{ display: { xs: 'none', lg: 'block' } }}>
                            Home
                        </Typography>
                        <Box sx={{ flexGrow: 1, textAlign: 'right' }}>
                            <Button
                                onClick={() => setFilterDrawerOpen(true)}
                                startIcon={<FilterListIcon />}
                                color="inherit"
                                sx={{
                                    textTransform: 'none',
                                    fontWeight: 700,
                                    fontSize: '0.875rem',
                                    color: hasActiveFilters ? 'primary.main' : 'text.secondary',
                                }}
                            >
                                {hasActiveFilters ? 'Filters Active' : 'Filter'}
                            </Button>
                            {hasActiveFilters && (
                                <Button
                                    variant="text"
                                    onClick={() => setFilters(INITIAL_FEED_FILTERS)}
                                    sx={{
                                        color: 'primary.main',
                                        fontWeight: 700,
                                        textTransform: 'none',
                                        ml: 1,
                                        '&:hover': { bgcolor: 'transparent', textDecoration: 'underline' }
                                    }}
                                >
                                    Clear
                                </Button>
                            )}
                        </Box>
                    </Stack>

                    {/* Active Context Banner */}
                    {(filters.author || filters.selectedLocation) && (
                        <Stack direction="column" spacing={1} sx={{ px: 2, pb: 1.5 }}>
                            {filters.author && (
                                <RouterLink
                                    to="/profile/$username"
                                    params={{ username: filters.author.username }}
                                    style={{ textDecoration: 'none', width: '100%', flexShrink: 1 }}
                                >
                                    <Button
                                        variant="outlined"
                                        color="primary"
                                        fullWidth
                                        startIcon={<Avatar src={filters.author.avatarUrl || undefined} sx={{ width: 24, height: 24 }} />}
                                        sx={{ 
                                            justifyContent: 'flex-start',
                                            textTransform: 'none',
                                            borderRadius: 3,
                                            py: 1,
                                            px: 2,
                                            fontWeight: 700,
                                            borderWidth: 1.5,
                                            '&:hover': { borderWidth: 1.5 }
                                        }}
                                    >
                                        <Box sx={{ flex: 1, textAlign: 'left', overflow: 'hidden' }}>
                                            <Typography variant="subtitle2" component="span" sx={{ display: 'block', lineHeight: 1.2, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                                {filters.author.displayName}
                                            </Typography>
                                            <Typography variant="caption" color="text.secondary" sx={{ display: 'block', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                                View Profile (@{filters.author.username})
                                            </Typography>
                                        </Box>
                                    </Button>
                                </RouterLink>
                            )}
                            {filters.selectedLocation && (
                                <Chip
                                    label={`Near ${filters.selectedLocation.name}`}
                                    onDelete={() => setFilters(prev => ({ ...prev, selectedLocation: undefined }))}
                                    color="secondary"
                                    variant="outlined"
                                    sx={{ borderRadius: 2, alignSelf: 'flex-start' }}
                                />
                            )}
                        </Stack>
                    )}

                    <Tabs
                        value={activeTab}
                        onChange={(_, newValue) => {
                            if (newValue !== activeTab) {
                                setActiveTab(newValue);
                                // Force immediate invalidation to trigger loading state
                                queryClient.invalidateQueries({ queryKey: ['feed'] });
                            }
                        }}
                        variant="fullWidth"
                        TabIndicatorProps={{
                            children: <span className="MuiTabs-indicatorSpan" />,
                        }}
                        sx={{
                            '& .MuiTabs-indicator': {
                                display: 'flex',
                                justifyContent: 'center',
                                backgroundColor: 'transparent',
                            },
                            '& .MuiTabs-indicatorSpan': {
                                width: 56,
                                height: 4,
                                borderRadius: '4px 4px 0 0',
                                backgroundColor: 'primary.main',
                            },
                            borderBottom: 'none'
                        }}
                    >
                        <Tab
                            label="Latest"
                            sx={{
                                textTransform: 'none',
                                fontWeight: activeTab === 0 ? 700 : 500,
                                fontSize: '0.9375rem'
                            }}
                        />
                        {user && (
                            <Tab
                                label="Following"
                                sx={{
                                    textTransform: 'none',
                                    fontWeight: activeTab === 1 ? 700 : 500,
                                    fontSize: '0.9375rem'
                                }}
                            />
                        )}
                    </Tabs>
                </Container>
            </Box>

            <Container maxWidth="sm" sx={{ py: 2 }}>
                {activeTab === 0 ? (
                    <GlobalFeed 
                        userId={user?.user.id} 
                        filters={filters} 
                        userLocation={userLocation}
                        setFilters={setFilters}
                        hasActiveFilters={hasActiveFilters}
                    />
                ) : (
                    <FollowingFeed userId={user?.user.id} />
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

function GlobalFeed({ userId, filters, userLocation, setFilters, hasActiveFilters }: any) {
    console.log('[GlobalFeed] Render. User:', userId);
    // Only apply global filters
    const queryFilters = useConstructFeedFilters(filters, userLocation, 0); 
    const {
        data,
        fetchNextPage,
        hasNextPage,
        isFetchingNextPage,
        isFetching,
        isLoading,
        error
    } = useFeedQuery(userId, 10, queryFilters);

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

    const allItems = data?.pages.flat() || [];

    return (
        <FeedContent
            isLoading={isLoading}
            isFetching={isFetching}
            error={error}
            allItems={allItems}
            hasActiveFilters={hasActiveFilters}
            activeTab={0}
            setFilters={setFilters}
            isFetchingNextPage={isFetchingNextPage}
            hasNextPage={hasNextPage}
            lastElementRef={lastElementRef}
            currentUserId={userId}
        />
    );
}

function FollowingFeed({ userId }: { userId?: string }) {
    console.log('[FollowingFeed] Render. User:', userId);
    const {
        data,
        fetchNextPage,
        hasNextPage,
        isFetchingNextPage,
        isFetching,
        isLoading,
        error
    } = useFollowingFeedQuery(userId, 10);

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

    const allItems = data?.pages.flat() || [];

    return (
        <FeedContent
            isLoading={isLoading}
            isFetching={isFetching}
            error={error}
            allItems={allItems}
            hasActiveFilters={false}
            activeTab={1}
            setFilters={() => {}} // No filters for following feed
            isFetchingNextPage={isFetchingNextPage}
            hasNextPage={hasNextPage}
            lastElementRef={lastElementRef}
            currentUserId={userId}
        />
    );
}
