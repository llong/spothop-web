import { useState, useCallback } from 'react';
import {
    Box,
    Typography,
    CircularProgress,
    Button,
    Stack,
    Paper,
} from '@mui/material';
import AddLocationIcon from '@mui/icons-material/AddLocation';
import FilterListIcon from '@mui/icons-material/FilterList';
import { Virtuoso } from 'react-virtuoso';
import { FeedItemCard } from './FeedItem';
import { FeedItemSkeleton } from './FeedItemSkeleton';
import { FeedCommentDialog } from './FeedCommentDialog';
import type { FeedItem } from 'src/types';
import { INITIAL_FEED_FILTERS } from 'src/atoms/feed';

interface FeedContentProps {
    isLoading: boolean;
    isFetching?: boolean;
    error: unknown;
    allItems: FeedItem[];
    hasActiveFilters: boolean;
    activeTab: number;
    setFilters: (filters: typeof INITIAL_FEED_FILTERS) => void;
    isFetchingNextPage: boolean;
    hasNextPage: boolean;
    fetchNextPage: () => void;
    currentUserId?: string;
}

export function FeedContent({
    isLoading,
    isFetching,
    error,
    allItems,
    hasActiveFilters,
    activeTab,
    setFilters,
    isFetchingNextPage,
    hasNextPage,
    fetchNextPage,
    currentUserId
}: FeedContentProps) {
    const [activeCommentItem, setActiveCommentItem] = useState<FeedItem | null>(null);

    const handleCommentClick = useCallback((item: FeedItem) => {
        setActiveCommentItem(item);
    }, []);

    const handleCloseCommentDialog = useCallback(() => {
        setActiveCommentItem(null);
    }, []);

    if (isLoading || (isFetching && allItems.length === 0)) {
        return (
            <Stack spacing={0}>
                {[...Array(3)].map((_, i) => (
                    <FeedItemSkeleton key={i} />
                ))}
            </Stack>
        );
    }

    if (error) {
        return (
            <Paper sx={{ p: 4, textAlign: 'center', borderRadius: 4, mt: 6 }}>
                <Typography color="error" gutterBottom>Failed to load feed</Typography>
                <Button variant="contained" onClick={() => window.location.reload()}>Retry</Button>
            </Paper>
        );
    }

    if (allItems.length === 0) {
        return (
            <Paper sx={{ p: 4, textAlign: 'center', borderRadius: 4, border: '2px dashed', borderColor: 'grey.300', bgcolor: 'grey.50', mt: 6 }}>
                {hasActiveFilters ? (
                    <>
                        <FilterListIcon sx={{ fontSize: 64, color: 'grey.400', mb: 2 }} />
                        <Typography variant="h5" fontWeight={700} gutterBottom>No matches found</Typography>
                        <Typography variant="body1" color="text.secondary" sx={{ mb: 4 }}>
                            We couldn't find any spots matching your current filters. Try using broader settings to see more content.
                        </Typography>
                                <Button variant="contained" size="large" onClick={() => setFilters(INITIAL_FEED_FILTERS)} sx={{ px: 4, py: 1.5 }}>
                                    Clear All Filters
                                </Button>
                    </>
                ) : (
                    <>
                        <AddLocationIcon sx={{ fontSize: 64, color: 'grey.400', mb: 2 }} />
                        <Typography variant="h5" fontWeight={700} gutterBottom>No spots yet!</Typography>
                        <Typography variant="body1" color="text.secondary" sx={{ mb: 4 }}>
                            {activeTab === 1 ? "You aren't following anyone yet, or they haven't posted any spots." : "The global feed is currently empty. Be the first to share a skate spot with the community!"}
                        </Typography>
                        <Stack spacing={2}>
                            <Typography variant="subtitle2" fontWeight={700}>Quick Tutorial:</Typography>
                            <Typography variant="body2">1. Go to the Spots page</Typography>
                            <Typography variant="body2">2. Long press on the map</Typography>
                            <Typography variant="body2">3. Add details and media</Typography>
                <Button variant="contained" size="large" sx={{ mt: 2 }} href="/?search=">
                    Go to Spots Map
                </Button>
                        </Stack>
                    </>
                )}
            </Paper>
        );
    }

    return (
        <>
            <Virtuoso
                useWindowScroll
                data={allItems}
                endReached={() => {
                    if (hasNextPage && !isFetchingNextPage) {
                        fetchNextPage();
                    }
                }}
                itemContent={(index, item) => (
                    <FeedItemCard
                        key={`${item.media_id}-${index}`}
                        item={item}
                        currentUserId={currentUserId}
                        onCommentClick={handleCommentClick}
                    />
                )}
                components={{
                    Footer: () => (
                        <Box sx={{ pb: 4 }}>
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
                        </Box>
                    )
                }}
            />

            {activeCommentItem && (
                <FeedCommentDialog
                    open={Boolean(activeCommentItem)}
                    onClose={handleCloseCommentDialog}
                    item={activeCommentItem}
                    userId={currentUserId}
                />
            )}
        </>
    );
}