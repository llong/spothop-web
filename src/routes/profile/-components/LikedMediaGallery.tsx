import { Card, CardContent, Grid, Typography, Box, CircularProgress } from "@mui/material";
import { Favorite, PlayCircleOutline } from "@mui/icons-material";
import { Link } from "@tanstack/react-router";
import { Avatar, Stack } from "@mui/material";
import type { LikedMediaItem } from "src/types";

interface LikedMediaGalleryProps {
    likedMedia: LikedMediaItem[];
    loadingMedia: boolean;
}

const MediaCard = ({ item }: { item: LikedMediaItem }) => (
    <Card variant="outlined" sx={{ height: '100%' }}>
        <Box sx={{ position: 'relative', pt: '75%', bgcolor: 'black' }}>
            {item.type === 'photo' ? (
                <Box
                    component="img"
                    src={item.url}
                    sx={{
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        width: '100%',
                        height: '100%',
                        objectFit: 'cover'
                    }}
                />
            ) : (
                <Box sx={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Box
                        component="img"
                        src={item.thumbnailUrl}
                        sx={{
                            width: '100%',
                            height: '100%',
                            objectFit: 'cover',
                            opacity: 0.7
                        }}
                    />
                    <PlayCircleOutline sx={{ position: 'absolute', fontSize: 48, color: 'white' }} />
                </Box>
            )}
        </Box>
        <CardContent sx={{ p: 2 }}>
            <Link to="/spots/$spotId" params={{ spotId: item.spot.id }} style={{ textDecoration: 'none', color: 'inherit' }}>
                <Typography variant="subtitle2" fontWeight={700} noWrap gutterBottom>
                    {item.spot.name}
                </Typography>
            </Link>
            <Stack direction="row" spacing={1} alignItems="center">
                <Typography variant="caption" color="text.secondary">By</Typography>
                <Link
                    to="/profile/$username"
                    params={{ username: item.author.username! }}
                    style={{ textDecoration: 'none' }}
                >
                    <Stack direction="row" spacing={0.5} alignItems="center">
                        <Avatar src={item.author.avatarUrl || undefined} sx={{ width: 16, height: 16 }} />
                        <Typography variant="caption" fontWeight={600} color="primary">
                            @{item.author.username}
                        </Typography>
                    </Stack>
                </Link>
            </Stack>
        </CardContent>
    </Card>
);

export const LikedMediaGallery = ({ likedMedia, loadingMedia }: LikedMediaGalleryProps) => {
    return (
        <Card>
            <CardContent>
                <Typography variant="h6" component="h2" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1, fontWeight: 700 }}>
                    <Favorite color="error" fontSize="small" /> Liked Photos & Videos
                </Typography>
                <Grid container spacing={2}>
                    {likedMedia.length === 0 && !loadingMedia && (
                        <Grid size={{ xs: 12 }}>
                            <Typography variant="body2" color="text.secondary">No liked media yet.</Typography>
                        </Grid>
                    )}
                    {loadingMedia && (
                        <Grid size={{ xs: 12 }} sx={{ display: 'flex', justifyContent: 'center', py: 3 }}>
                            <CircularProgress size={24} />
                        </Grid>
                    )}
                    {likedMedia.map((item) => (
                        <Grid size={{ xs: 12, sm: 6, md: 4 }} key={item.id}>
                            <MediaCard item={item} />
                        </Grid>
                    ))}
                </Grid>
            </CardContent>
        </Card>
    );
};