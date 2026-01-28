import { createLazyFileRoute, Link } from '@tanstack/react-router';
import {
    Box,
    Container,
    Typography,
    CircularProgress,
    Button,
    Stack,
    Paper,
} from '@mui/material';
import { useFeedQuery } from 'src/hooks/useFeedQueries';
import { FeedItemCard } from './-components/FeedItem';
import { useAtomValue } from 'jotai';
import { userAtom } from 'src/atoms/auth';
import { useRef, useCallback } from 'react';
import AddLocationIcon from '@mui/icons-material/AddLocation';

export const Route = createLazyFileRoute('/feed/')({
    component: FeedScreen,
});

function FeedScreen() {
    const user = useAtomValue(userAtom);
    const {
        data,
        fetchNextPage,
        hasNextPage,
        isFetchingNextPage,
        isLoading,
        error
    } = useFeedQuery(user?.user.id);

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
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
                <CircularProgress />
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
                </Paper>
            </Container>
        );
    }

    return (
        <Box sx={{ py: 4, bgcolor: 'grey.50', minHeight: '100vh' }}>
            <Container maxWidth="sm">
                <Typography variant="h4" fontWeight={900} sx={{ mb: 4, px: 2 }}>
                    Global Feed
                </Typography>

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
        </Box>
    );
}
