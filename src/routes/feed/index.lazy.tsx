import { createLazyFileRoute } from '@tanstack/react-router';
import {
    Box,
    Container,
    Drawer,
    Tabs,
    Tab,
} from '@mui/material';
import { useAtomValue, useAtom } from 'jotai';
import { userAtom } from 'src/atoms/auth';
import { userLocationAtom } from 'src/atoms/map';
import { useQueryClient } from '@tanstack/react-query';
import { feedFiltersAtom, INITIAL_FEED_FILTERS } from 'src/atoms/feed';
import { useState, useMemo } from 'react';
import { FeedFilterPanel } from './-components/FeedFilterPanel';
import { FeedContent } from './-components/FeedContent';
import { FeedHeader } from './-components/FeedHeader';
import { useGlobalFeed, useFollowingFeed } from './hooks/useFeedData';
import SEO from 'src/components/SEO/SEO';
import { analytics } from 'src/lib/posthog';

export const Route = createLazyFileRoute('/feed/')({
    component: FeedScreen,
});

export function FeedScreen() {
    const queryClient = useQueryClient();
    const user = useAtomValue(userAtom);
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
            <SEO
                title="Feed"
                description="Stay up to date with the latest skate spots and media from the SpotHop community."
                url="/feed"
            />
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
                    <FeedHeader
                        hasActiveFilters={hasActiveFilters}
                        onFilterClick={() => setFilterDrawerOpen(true)}
                        onClearFilters={() => setFilters(INITIAL_FEED_FILTERS)}
                        filters={filters}
                        onRemoveLocation={() => setFilters(prev => ({ ...prev, selectedLocation: undefined }))}
                    />

                    <Tabs
                        value={activeTab}
                        onChange={(_, newValue) => {
                            if (newValue !== activeTab) {
                                setActiveTab(newValue);
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
                    <GlobalFeedContent
                        userId={user?.user.id}
                        filters={filters}
                        userLocation={userLocation}
                        setFilters={setFilters}
                        hasActiveFilters={hasActiveFilters}
                    />
                ) : (
                    <FollowingFeedContent userId={user?.user.id} />
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
                        analytics.capture('feed_filter_changed', {
                            near_me: newFilters.nearMe,
                            spot_types: newFilters.spotTypes,
                            difficulties: newFilters.difficulties,
                            rider_types: newFilters.riderTypes,
                            max_risk: newFilters.maxRisk
                        });
                    }}
                    onClose={() => setFilterDrawerOpen(false)}
                />
            </Drawer>
        </Box>
    );
}

function GlobalFeedContent({ userId, filters, userLocation, setFilters, hasActiveFilters }: any) {
    const {
        allItems,
        isLoading,
        isFetching,
        error,
        hasNextPage,
        isFetchingNextPage,
        lastElementRef
    } = useGlobalFeed(userId, filters, userLocation);

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

function FollowingFeedContent({ userId }: { userId?: string }) {
    const {
        allItems,
        isLoading,
        isFetching,
        error,
        hasNextPage,
        isFetchingNextPage,
        lastElementRef
    } = useFollowingFeed(userId);

    return (
        <FeedContent
            isLoading={isLoading}
            isFetching={isFetching}
            error={error}
            allItems={allItems}
            hasActiveFilters={false}
            activeTab={1}
            setFilters={() => { }}
            isFetchingNextPage={isFetchingNextPage}
            hasNextPage={hasNextPage}
            lastElementRef={lastElementRef}
            currentUserId={userId}
        />
    );
}
