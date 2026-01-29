import { memo } from 'react';
import {
    Box,
    Card,
    CardHeader,
    CardContent,
    CardActions,
    Skeleton,
    Stack
} from '@mui/material';

export const FeedItemSkeleton = memo(() => {
    return (
        <Box data-testid="feed-item-skeleton">
        <Card
            elevation={2}
            sx={{
                maxWidth: 600,
                mx: 'auto',
                mb: 4,
                borderRadius: 4,
                overflow: 'hidden'
            }}
        >
            <CardHeader
                avatar={<Skeleton animation="wave" variant="circular" width={40} height={40} />}
                title={<Skeleton animation="wave" height={10} width="40%" style={{ marginBottom: 6 }} />}
                subheader={<Skeleton animation="wave" height={10} width="20%" />}
            />
            <Skeleton sx={{ height: 600 }} animation="wave" variant="rectangular" />
            <CardContent>
                <Stack direction="row" justifyContent="space-between" alignItems="flex-start">
                    <Box sx={{ width: '70%' }}>
                        <Skeleton animation="wave" height={20} style={{ marginBottom: 6 }} />
                        <Skeleton animation="wave" height={15} width="80%" />
                    </Box>
                    <Skeleton animation="wave" variant="rectangular" width={60} height={24} />
                </Stack>
            </CardContent>
            <CardActions disableSpacing sx={{ px: 2, pb: 2 }}>
                <Stack direction="row" spacing={1} alignItems="center">
                    <Skeleton animation="wave" variant="circular" width={24} height={24} />
                    <Skeleton animation="wave" height={10} width={20} />
                    <Skeleton animation="wave" variant="circular" width={24} height={24} />
                    <Skeleton animation="wave" height={10} width={20} />
                    <Skeleton animation="wave" variant="circular" width={24} height={24} />
                </Stack>
                <Box sx={{ flexGrow: 1 }} />
                <Skeleton animation="wave" variant="circular" width={24} height={24} />
            </CardActions>
        </Card>
        </Box>
    );
});
