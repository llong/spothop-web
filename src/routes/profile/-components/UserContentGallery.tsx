import { useState, useEffect, useCallback } from 'react';
import { Box, Tabs, Tab, Typography, Grid, Card, CardContent, ListItemAvatar, Avatar, ListItemText, ListItemButton, ListItem, List, Dialog, DialogContent, IconButton, Stack, Chip } from '@mui/material';
import { Link } from '@tanstack/react-router';
import { PlayCircleOutline, Close, ChevronLeft, ChevronRight, LocationOn, CalendarToday } from '@mui/icons-material';
import type { Spot, UserMediaItem } from 'src/types';
import { format } from 'date-fns';

interface UserContentGalleryProps {
    createdSpots: Spot[];
    uploadedMedia: UserMediaItem[];
    isLoading: boolean;
}

interface TabPanelProps {
    children?: React.ReactNode;
    index: number;
    value: number;
}

function CustomTabPanel(props: TabPanelProps) {
    const { children, value, index, ...other } = props;

    return (
        <div
            role="tabpanel"
            hidden={value !== index}
            id={`simple-tabpanel-${index}`}
            aria-labelledby={`simple-tab-${index}`}
            {...other}
        >
            {value === index && (
                <Box sx={{ py: 3 }}>
                    {children}
                </Box>
            )}
        </div>
    );
}

export const UserContentGallery = ({ createdSpots, uploadedMedia, isLoading }: UserContentGalleryProps) => {
    const [tabValue, setTabValue] = useState(0);
    const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);

    const handleTabChange = (_event: React.SyntheticEvent, newValue: number) => {
        setTabValue(newValue);
    };

    const openLightbox = (index: number) => {
        setLightboxIndex(index);
    };

    const closeLightbox = () => {
        setLightboxIndex(null);
    };

    const nextMedia = useCallback(() => {
        if (lightboxIndex !== null) {
            setLightboxIndex((prev) => (prev! + 1) % uploadedMedia.length);
        }
    }, [lightboxIndex, uploadedMedia.length]);

    const prevMedia = useCallback(() => {
        if (lightboxIndex !== null) {
            setLightboxIndex((prev) => (prev! - 1 + uploadedMedia.length) % uploadedMedia.length);
        }
    }, [lightboxIndex, uploadedMedia.length]);

    // Handle keyboard navigation
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (lightboxIndex === null) return;
            if (e.key === 'ArrowRight') nextMedia();
            if (e.key === 'ArrowLeft') prevMedia();
            if (e.key === 'Escape') closeLightbox();
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [lightboxIndex, nextMedia, prevMedia]);

    if (isLoading) {
        return <Typography>Loading content...</Typography>;
    }

    const currentMedia = lightboxIndex !== null ? uploadedMedia[lightboxIndex] : null;

    return (
        <Box sx={{ width: '100%' }}>
            <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
                <Tabs value={tabValue} onChange={handleTabChange} aria-label="user content tabs">
                    <Tab label={`Spots (${createdSpots.length})`} id="tab-0" />
                    <Tab label={`Media (${uploadedMedia.length})`} id="tab-1" />
                </Tabs>
            </Box>

            <CustomTabPanel value={tabValue} index={0}>
                {createdSpots.length === 0 ? (
                    <Typography color="text.secondary">No spots created yet.</Typography>
                ) : (
                    <List sx={{ width: '100%', bgcolor: 'background.paper' }}>
                        {createdSpots.map((spot) => (
                            <ListItem key={spot.id} disablePadding divider>
                                <Link to="/spots/$spotId" params={{ spotId: spot.id.toString() }} style={{ textDecoration: 'none', width: '100%', color: 'inherit' }}>
                                    <ListItemButton sx={{ py: 2 }}>
                                        <ListItemAvatar>
                                            <Avatar
                                                variant="rounded"
                                                src={spot.photoUrl || undefined}
                                                sx={{ width: 120, height: 90, mr: 2 }}
                                            />
                                        </ListItemAvatar>
                                        <ListItemText
                                            primary={spot.name}
                                            secondary={
                                                <Box sx={{ mt: 0.5 }}>
                                                    <Stack direction="row" spacing={0.5} alignItems="center">
                                                        <LocationOn sx={{ fontSize: 14 }} color="action" />
                                                        <Typography variant="body2" color="text.secondary">
                                                            {[
                                                                [spot.city, spot.state].filter(Boolean).join(', '),
                                                                spot.country
                                                            ].filter(Boolean).join(', ') || 'Unknown Location'}
                                                        </Typography>
                                                    </Stack>
                                                    <Stack direction="row" spacing={0.5} alignItems="center">
                                                        <CalendarToday sx={{ fontSize: 14 }} color="action" />
                                                        <Typography variant="body2" color="text.secondary">
                                                            {spot.created_at ? format(new Date(spot.created_at), 'MMM d, yyyy') : 'N/A'}
                                                        </Typography>
                                                    </Stack>
                                                    <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mt: 1 }}>
                                                        {spot.difficulty && (
                                                            <Chip
                                                                label={spot.difficulty.charAt(0).toUpperCase() + spot.difficulty.slice(1)}
                                                                size="small"
                                                                color={spot.difficulty === 'advanced' ? 'error' : spot.difficulty === 'intermediate' ? 'warning' : 'success'}
                                                                sx={{ height: 20, fontSize: '0.65rem' }}
                                                            />
                                                        )}
                                                        {spot.kickout_risk !== undefined && (
                                                            <Chip
                                                                label={`Risk: ${spot.kickout_risk}/10`}
                                                                size="small"
                                                                variant="outlined"
                                                                sx={{ height: 20, fontSize: '0.65rem' }}
                                                            />
                                                        )}
                                                        {spot.spot_type?.slice(0, 3).map((type: string) => (
                                                            <Chip
                                                                key={type}
                                                                label={type.toUpperCase()}
                                                                size="small"
                                                                variant="outlined"
                                                                color="primary"
                                                                sx={{ height: 20, fontSize: '0.65rem' }}
                                                            />
                                                        ))}
                                                    </Box>
                                                </Box>
                                            }
                                            secondaryTypographyProps={{ component: 'div' }}
                                            primaryTypographyProps={{ variant: 'h6', fontWeight: 600 }}
                                        />
                                    </ListItemButton>
                                </Link>
                            </ListItem>
                        ))}
                    </List>
                )}
            </CustomTabPanel>

            <CustomTabPanel value={tabValue} index={1}>
                {uploadedMedia.length === 0 ? (
                    <Typography color="text.secondary">No media uploaded yet.</Typography>
                ) : (
                    <Grid container spacing={2}>
                        {uploadedMedia.map((item, index) => (
                            <Grid size={{ xs: 12, sm: 6, md: 4 }} key={item.id}>
                                <Card
                                    variant="outlined"
                                    sx={{ height: '100%', cursor: 'pointer', '&:hover': { boxShadow: 2 } }}
                                    onClick={() => openLightbox(index)}
                                >
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
                                                {item.thumbnailUrl && (
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
                                                )}
                                                <PlayCircleOutline sx={{ position: 'absolute', fontSize: 48, color: 'white' }} />
                                            </Box>
                                        )}
                                    </Box>
                                    <CardContent sx={{ p: 2 }}>
                                        <Typography variant="subtitle2" fontWeight={700} noWrap gutterBottom>
                                            {item.spot.name}
                                        </Typography>
                                        <Stack spacing={0.5}>
                                            <Stack direction="row" spacing={0.5} alignItems="center">
                                                <LocationOn sx={{ fontSize: 12 }} color="action" />
                                                <Typography variant="caption" color="text.secondary" noWrap sx={{ width: '100%' }}>
                                                    {[
                                                        [item.spot.city, (item.spot as any).state].filter(Boolean).join(', '),
                                                        item.spot.country
                                                    ].filter(Boolean).join(', ') || 'Unknown Location'}
                                                </Typography>
                                            </Stack>
                                            <Stack direction="row" spacing={0.5} alignItems="center">
                                                <CalendarToday sx={{ fontSize: 12 }} color="action" />
                                                <Typography variant="caption" color="text.secondary">
                                                    {format(new Date(item.created_at), 'MMM d, yyyy')}
                                                </Typography>
                                            </Stack>
                                        </Stack>
                                    </CardContent>
                                </Card>
                            </Grid>
                        ))}
                    </Grid>
                )}
            </CustomTabPanel>

            {/* Lightbox Dialog */}
            <Dialog
                open={lightboxIndex !== null}
                onClose={closeLightbox}
                maxWidth="md"
                fullWidth
                PaperProps={{
                    sx: { bgcolor: 'black', position: 'relative', m: 0, maxHeight: '90vh' }
                }}
            >
                <IconButton
                    onClick={closeLightbox}
                    sx={{ position: 'absolute', right: 8, top: 8, color: 'white', zIndex: 1 }}
                >
                    <Close />
                </IconButton>

                <DialogContent sx={{ p: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 400 }}>
                    {currentMedia && (
                        <Box sx={{ width: '100%', height: '100%', position: 'relative' }}>
                            {currentMedia.type === 'photo' ? (
                                <Box
                                    component="img"
                                    src={currentMedia.url}
                                    sx={{ width: '100%', height: 'auto', maxHeight: '80vh', objectFit: 'contain' }}
                                />
                            ) : (
                                <Box
                                    component="video"
                                    src={currentMedia.url}
                                    controls
                                    autoPlay
                                    sx={{ width: '100%', height: 'auto', maxHeight: '80vh' }}
                                />
                            )}

                            {/* Navigation Arrows */}
                            {uploadedMedia.length > 1 && (
                                <>
                                    <IconButton
                                        onClick={(e) => { e.stopPropagation(); prevMedia(); }}
                                        sx={{ position: 'absolute', left: 8, top: '50%', transform: 'translateY(-50%)', color: 'white', bgcolor: 'rgba(255,255,255,0.1)', '&:hover': { bgcolor: 'rgba(255,255,255,0.2)' } }}
                                    >
                                        <ChevronLeft fontSize="large" />
                                    </IconButton>
                                    <IconButton
                                        onClick={(e) => { e.stopPropagation(); nextMedia(); }}
                                        sx={{ position: 'absolute', right: 8, top: '50%', transform: 'translateY(-50%)', color: 'white', bgcolor: 'rgba(255,255,255,0.1)', '&:hover': { bgcolor: 'rgba(255,255,255,0.2)' } }}
                                    >
                                        <ChevronRight fontSize="large" />
                                    </IconButton>
                                </>
                            )}
                        </Box>
                    )}
                </DialogContent>

                {currentMedia && (
                    <Box sx={{ p: 2, bgcolor: 'rgba(0,0,0,0.8)', color: 'white' }}>
                        <Link to="/spots/$spotId" params={{ spotId: currentMedia.spot.id }} onClick={closeLightbox} style={{ textDecoration: 'none', color: 'inherit' }}>
                            <Typography variant="subtitle1" fontWeight={700}>
                                {currentMedia.spot.name}
                            </Typography>
                        </Link>
                        <Typography variant="caption" sx={{ opacity: 0.8 }}>
                            {[
                                [currentMedia.spot.city, (currentMedia.spot as any).state].filter(Boolean).join(', '),
                                currentMedia.spot.country
                            ].filter(Boolean).join(', ')} • {format(new Date(currentMedia.created_at), 'PPP')}
                        </Typography>
                    </Box>
                )}
            </Dialog>
        </Box>
    );
};
