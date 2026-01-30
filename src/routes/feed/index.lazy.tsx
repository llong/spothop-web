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
} from '@mui/material';
import { useFeedQuery } from 'src/hooks/useFeedQueries';
import { useConstructFeedFilters } from 'src/hooks/useConstructFeedFilters';
import { useAtomValue, useAtom } from 'jotai';
import { userAtom } from 'src/atoms/auth';
import { userLocationAtom } from 'src/atoms/map';
import { feedFiltersAtom } from 'src/atoms/feed';
import { useRef, useCallback, useState, useMemo } from 'react';
import FilterListIcon from '@mui/icons-material/FilterList';
import { FeedFilterPanel } from './-components/FeedFilterPanel';
import { FeedContent } from './-components/FeedContent';

export const Route = createLazyFileRoute('/feed/')({
    component: FeedScreen,
});

export function FeedScreen() {
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
            filters.maxRisk < 5;
    }, [filters]);

    const queryFilters = useConstructFeedFilters(filters, userLocation, activeTab);

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

    const allItems = data?.pages.flat() || [];

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
                <Container maxWidth="sm">
                    <Stack direction="row" justifyContent="flex-end" alignItems="center" sx={{ pt: 2, pb: 1, px: 2 }}>
                        <Button
                            onClick={() => setFilterDrawerOpen(true)}
                            startIcon={<FilterListIcon />}
                            color="inherit"
                            sx={{
                                textTransform: 'uppercase',
                                fontWeight: 700,
                                fontSize: '0.875rem',
                                color: hasActiveFilters ? 'primary.main' : 'text.secondary',
                            }}
                        >
                            FILTER RESULTS
                        </Button>
                    </Stack>
                    <Tabs
                        value={activeTab}
                        onChange={(_, newValue) => setActiveTab(newValue)}
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
                            label="For you"
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
                <FeedContent
                    isLoading={isLoading}
                    error={error}
                    allItems={allItems}
                    hasActiveFilters={hasActiveFilters}
                    activeTab={activeTab}
                    setFilters={setFilters}
                    isFetchingNextPage={isFetchingNextPage}
                    hasNextPage={hasNextPage}
                    lastElementRef={lastElementRef}
                    currentUserId={user?.user.id}
                />
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