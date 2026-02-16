import { createFileRoute, Link } from '@tanstack/react-router';
import { useQuery } from '@tanstack/react-query';
import { contestService } from '@/services/contestService';
import {
    Box,
    Container,
    Typography,
    Grid,
    Card,
    CardContent,
    CardMedia,
    CardActionArea,
    Chip,
    Skeleton,
    Divider,
    Dialog,
    IconButton,
    Button
} from '@mui/material';
import { Close as CloseIcon, ZoomIn as ZoomInIcon, EmojiEvents as EmojiEventsIcon } from '@mui/icons-material';
import type { ContestStatus } from '@/types';
import { useState } from 'react';

export const Route = createFileRoute('/contests/')({
    component: ContestsPage,
});

function ContestsPage() {
    const [previewImage, setPreviewImage] = useState<string | null>(null);
    const { data: contests, isLoading, error } = useQuery({
        queryKey: ['contests', 'active'],
        queryFn: () => contestService.fetchActiveContests()
    });

    const getStatusColor = (status: ContestStatus) => {
        switch (status) {
            case 'active': return 'success';
            case 'voting': return 'warning';
            case 'finished': return 'default';
            default: return 'primary';
        }
    };

    if (error) {
        return (
            <Container maxWidth="md" sx={{ py: 4 }}>
                <Box bgcolor="error.light" p={3} borderRadius={2}>
                    <Typography color="error.main">Error loading contests: {(error as any).message}</Typography>
                </Box>
            </Container>
        );
    }

    return (
        <Container maxWidth="md" sx={{ py: 4 }}>
            <Box mb={4}>
                <Typography variant="h4" component="h1" gutterBottom fontWeight="bold">
                    Contests & Challenges
                </Typography>
                <Typography variant="body1" color="text.secondary">
                    Showcase your skills, discover new spots, and win prizes.
                </Typography>
            </Box>

            {isLoading ? (
                <Grid container spacing={4}>
                    {[1, 2].map((i) => (
                        <Grid size={{ xs: 12 }} key={i}>
                            <Skeleton variant="rectangular" height={300} sx={{ borderRadius: 2 }} />
                            <Skeleton variant="text" sx={{ mt: 1, height: 40 }} />
                            <Skeleton variant="text" width="60%" />
                        </Grid>
                    ))}
                </Grid>
            ) : contests && contests.length > 0 ? (
                <Grid container spacing={4}>
                    {contests.map((contest) => (
                        <Grid size={{ xs: 12 }} key={contest.id}>
                            <Card elevation={0} sx={{ borderRadius: 3, border: '1px solid', borderColor: 'grey.200', overflow: 'hidden' }}>
                                <CardActionArea
                                    component={Link}
                                    {...({
                                        to: '/contests/$contestId',
                                        params: { contestId: contest.id },
                                    } as any)}
                                    sx={{ height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'stretch', justifyContent: 'flex-start' }}
                                >
                                    {/* Image Area - Click to Zoom */}
                                    <Box sx={{ position: 'relative', width: '100%' }}>
                                        <CardMedia
                                            component="img"
                                            height="350"
                                            image={contest.flyer_url || '/spothopIcon.png'}
                                            alt={contest.title}
                                            onClick={(e) => {
                                                e.preventDefault();
                                                e.stopPropagation();
                                                setPreviewImage(contest.flyer_url || '/spothopIcon.png');
                                            }}
                                            sx={{
                                                objectFit: 'cover',
                                                cursor: 'zoom-in',
                                                transition: 'opacity 0.2s',
                                                '&:hover': { opacity: 0.95 }
                                            }}
                                        />
                                        <Button
                                            variant="contained"
                                            size="small"
                                            startIcon={<ZoomInIcon />}
                                            onClick={(e) => {
                                                e.preventDefault();
                                                e.stopPropagation();
                                                setPreviewImage(contest.flyer_url || '/spothopIcon.png');
                                            }}
                                            sx={{
                                                position: 'absolute',
                                                top: 16,
                                                right: 16,
                                                bgcolor: 'rgba(0,0,0,0.6)',
                                                borderRadius: 8, // Pill shape
                                                textTransform: 'none',
                                                backdropFilter: 'blur(4px)',
                                                boxShadow: 'none',
                                                '&:hover': {
                                                    bgcolor: 'rgba(0,0,0,0.8)',
                                                    boxShadow: 'none'
                                                }
                                            }}
                                        >
                                            View Full
                                        </Button>
                                    </Box>

                                    {/* Content Area */}
                                    <CardContent sx={{ p: 3, width: '100%', flexGrow: 1 }}>
                                        <Box mb={2}>
                                            <Box display="flex" alignItems="center" gap={1} mb={0.5}>
                                                <Typography variant="h5" component="div" fontWeight="bold">
                                                    {contest.title}
                                                </Typography>
                                                <Chip
                                                    label={contest.status.toUpperCase()}
                                                    size="small"
                                                    color={getStatusColor(contest.status) as any}
                                                    sx={{ fontWeight: 'bold', fontSize: '0.7rem', height: 24 }}
                                                />
                                                <Chip
                                                    label={`${contest.entry_count || 0} entries`}
                                                    size="small"
                                                    variant="outlined"
                                                    sx={{ fontWeight: 'bold', fontSize: '0.7rem', height: 24 }}
                                                />
                                            </Box>
                                            <Typography variant="body2" color="text.secondary" gutterBottom>
                                                Ends {new Date(contest.end_date).toLocaleDateString()}
                                            </Typography>

                                            {contest.prize_info && (
                                                <Box display="flex" alignItems="center" gap={0.5} mt={1}>
                                                    <EmojiEventsIcon sx={{ fontSize: 18, color: 'text.secondary' }} />
                                                    <Typography variant="body2" color="text.secondary">
                                                        {contest.prize_info}
                                                    </Typography>
                                                </Box>
                                            )}
                                        </Box>

                                        <Divider sx={{ my: 2 }} />

                                        <Typography variant="body1" color="text.secondary" sx={{
                                            display: '-webkit-box',
                                            WebkitLineClamp: 3,
                                            WebkitBoxOrient: 'vertical',
                                            overflow: 'hidden',
                                            lineHeight: 1.6
                                        }}>
                                            {contest.description}
                                        </Typography>

                                        <Box sx={{ mt: 2, display: 'flex', gap: 1 }}>
                                            {contest.criteria?.required_media_types?.map(t => (
                                                <Chip key={t} label={`${t} contest`} size="small" variant="outlined" />
                                            ))}
                                        </Box>
                                    </CardContent>
                                </CardActionArea>
                            </Card>
                        </Grid>
                    ))}
                </Grid>
            ) : (
                <Box textAlign="center" py={8} bgcolor="action.hover" borderRadius={4}>
                    <Typography variant="h6" color="text.secondary">
                        No active contests right now. Check back soon!
                    </Typography>
                </Box>
            )}

            {/* Image Preview Modal */}
            <Dialog
                open={!!previewImage}
                onClose={() => setPreviewImage(null)}
                maxWidth="lg"
                fullWidth
                PaperProps={{
                    sx: { bgcolor: 'transparent', boxShadow: 'none' }
                }}
            >
                <Box sx={{ position: 'relative', display: 'flex', justifyContent: 'center' }}>
                    <IconButton
                        onClick={() => setPreviewImage(null)}
                        sx={{ position: 'absolute', top: -40, right: 0, color: 'white' }}
                    >
                        <CloseIcon />
                    </IconButton>
                    <img
                        src={previewImage || ''}
                        alt="Full size flyer"
                        style={{ maxWidth: '100%', maxHeight: '90vh', borderRadius: 8 }}
                    />
                </Box>
            </Dialog>
        </Container>
    );
}
