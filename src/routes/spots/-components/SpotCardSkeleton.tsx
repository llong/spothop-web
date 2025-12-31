import { Card, CardContent, Skeleton, Box, Grid, Container, Divider } from "@mui/material";

export const SpotCardSkeleton = () => {
    return (
        <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
            <Skeleton variant="rectangular" height={140} />
            <CardContent sx={{ flexGrow: 1 }}>
                <Skeleton variant="text" height={32} width="80%" />
                <Skeleton variant="text" height={20} width="60%" sx={{ mb: 1 }} />
                <Box sx={{ display: 'flex', gap: 1, mt: 1 }}>
                    <Skeleton variant="rounded" width={60} height={24} />
                    <Skeleton variant="rounded" width={60} height={24} />
                </Box>
            </CardContent>
        </Card>
    );
};

export const SpotListSkeleton = () => {
    return (
        <Grid container spacing={2}>
            {[1, 2, 4, 5, 6].map((i) => (
                <Grid size={{ xs: 12, lg: 6 }} key={i}>
                    <SpotCardSkeleton />
                </Grid>
            ))}
        </Grid>
    );
};

export const SpotDetailSkeleton = () => {
    return (
        <Box sx={{ bgcolor: 'grey.50', minHeight: '100vh', pb: 4 }}>
            {/* Header Skeleton */}
            <Box sx={{ p: 2, bgcolor: 'white', borderBottom: 1, borderColor: 'divider' }}>
                <Skeleton variant="text" width={200} height={40} />
            </Box>

            <Container maxWidth="lg" sx={{ mt: 3 }}>
                {/* Gallery Skeleton */}
                <Skeleton variant="rectangular" height={400} sx={{ borderRadius: 2, mb: 3 }} />

                <Grid container spacing={3}>
                    <Grid size={{ xs: 12, md: 8 }}>
                        {/* Info Skeleton */}
                        <Box sx={{ p: 3, bgcolor: 'white', borderRadius: 2 }}>
                            <Skeleton variant="text" width="60%" height={32} />
                            <Skeleton variant="text" width="40%" height={24} sx={{ mb: 2 }} />
                            <Skeleton variant="rectangular" height={100} sx={{ mb: 2 }} />
                            <Skeleton variant="text" width="100%" />
                            <Skeleton variant="text" width="90%" />
                        </Box>
                    </Grid>
                    <Grid size={{ xs: 12, md: 4 }}>
                        {/* Sidebar Skeleton */}
                        <Box sx={{ p: 3, bgcolor: 'white', borderRadius: 2 }}>
                            <Skeleton variant="rectangular" height={50} sx={{ mb: 2 }} />
                            <Skeleton variant="rectangular" height={50} sx={{ mb: 2 }} />
                            <Divider sx={{ my: 2 }} />
                            <Skeleton variant="text" width="80%" />
                            <Skeleton variant="text" width="80%" />
                        </Box>
                    </Grid>
                </Grid>
            </Container>
        </Box>
    );
};
