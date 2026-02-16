import {
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Button,
    Typography,
    IconButton,
    Chip,
    Box,
    Grid,
    Card,
    CardActionArea,
    CardMedia,
    CardContent,
    alpha,
    CircularProgress,
    Alert,
    useTheme,
    Stepper,
    Step,
    StepLabel,
    Divider
} from '@mui/material';
import {
    PlayArrow as PlayArrowIcon,
    Fullscreen as FullscreenIcon,
    Close as CloseIcon,
    CheckCircle as CheckCircleIcon
} from '@mui/icons-material';
import { getDistance } from "@/utils/geo";
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useState, useMemo } from 'react';
import { profileService } from "@/services/profileService";
import { contestService } from "@/services/contestService";
import { spotService } from "@/services/spotService";
import type { Contest } from "@/types";

interface Props {
    open: boolean;
    onClose: () => void;
    contest: Contest;
}

export function ContestSubmissionModal({ open, onClose, contest }: Props) {
    const [activeStep, setActiveStep] = useState(0);
    const [selectedSpotId, setSelectedSpotId] = useState<string | null>(null);
    const [selectedMediaId, setSelectedMediaId] = useState<string | null>(null);
    const [selectedMediaType, setSelectedMediaType] = useState<'photo' | 'video' | null>(null);
    const [isVideoPlaying, setIsVideoPlaying] = useState(false);
    const [fullscreenMedia, setFullscreenMedia] = useState<{ url: string; type: 'photo' | 'video' } | null>(null);

    const queryClient = useQueryClient();
    const theme = useTheme();

    // 1. Fetch user's profile and their contributed spots
    const { data: profile } = useQuery({
        queryKey: ['profile', 'me'],
        queryFn: async () => {
            const { data: { session } } = await (await import("@/supabase")).default.auth.getSession();
            if (!session) return null;
            return profileService.fetchIdentity(session.user.id);
        },
        enabled: open,
    });

    const { data: userContent, isLoading: spotsLoading } = useQuery({
        queryKey: ['user-content', profile?.id],
        queryFn: () => profileService.fetchUserContent(profile!.id),
        enabled: !!profile?.id,
    });

    const { data: favoriteSpots, isLoading: favoritesLoading } = useQuery({
        queryKey: ['user-favorites', profile?.id],
        queryFn: () => profileService.fetchFavoriteSpots(profile!.id),
        enabled: !!profile?.id && !contest.criteria.require_spot_creator_is_competitor,
    });

    // 2. Filter spots based on contest criteria
    const eligibleSpots = useMemo(() => {
        if (!userContent) return [];

        const requiredMediaTypes = contest.criteria.required_media_types || ['video'];
        const now = new Date();

        // 1. Find all media that qualifies for this contest
        const qualifiedMedia = (userContent.userMedia || []).filter(media => {
            // Must match contest media types
            if (!requiredMediaTypes.includes(media.type)) return false;

            // Media Creation Time Frame Restriction
            if (contest.criteria.media_creation_time_frame && contest.criteria.media_creation_time_frame !== 'anytime') {
                const mediaDate = new Date(media.created_at);
                let thresholdDate: Date;

                switch (contest.criteria.media_creation_time_frame) {
                    case 'during_competition':
                        thresholdDate = new Date(contest.start_date);
                        break;
                    case 'last_30_days':
                        thresholdDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
                        break;
                    case 'last_60_days':
                        thresholdDate = new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000);
                        break;
                    case 'last_90_days':
                        thresholdDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
                        break;
                    default:
                        thresholdDate = new Date(0);
                }

                if (mediaDate < thresholdDate) return false;
            }

            return true;
        });

        const qualifiedSpotIds = new Set(qualifiedMedia.map(m => m.spot.id));

        // 2. Filter available spots
        const spotsToFilter = [
            ...(userContent?.createdSpots || []),
            ...(favoriteSpots || [])
        ];

        // Remove duplicates (if user favorited their own spot)
        const uniqueSpots = Array.from(new Map(spotsToFilter.map(item => [item.id, item])).values());

        if (uniqueSpots.length === 0) return [];

        return uniqueSpots.filter(spot => {
            // MUST have at least one eligible media item at this spot
            if (!qualifiedSpotIds.has(spot.id)) return false;

            // Date criteria (Spot creation date if specified)
            if (contest.criteria.min_date) {
                const spotDate = new Date(spot.created_at!);
                const minDate = new Date(contest.criteria.min_date);
                if (spotDate < minDate) return false;
            }
            if (contest.criteria.max_date) {
                const spotDate = new Date(spot.created_at!);
                const maxDate = new Date(contest.criteria.max_date);
                if (spotDate > maxDate) return false;
            }

            // Spot type criteria
            if (contest.criteria.allowed_spot_types && contest.criteria.allowed_spot_types.length > 0) {
                const hasMatchingType = spot.spot_type?.some(type =>
                    contest.criteria.allowed_spot_types?.includes(type)
                );
                if (!hasMatchingType) return false;
            }

            // Difficulty criteria
            if (contest.criteria.allowed_difficulties && contest.criteria.allowed_difficulties.length > 0) {
                if (!spot.difficulty || !contest.criteria.allowed_difficulties.includes(spot.difficulty)) return false;
            }

            // Is Lit criteria
            if (typeof contest.criteria.allowed_is_lit === 'boolean') {
                if (spot.is_lit !== contest.criteria.allowed_is_lit) return false;
            }

            // Kickout Risk criteria
            if (typeof contest.criteria.allowed_kickout_risk_max === 'number') {
                if (!spot.kickout_risk || spot.kickout_risk > contest.criteria.allowed_kickout_risk_max) return false;
            }

            // Specific Spot ID criteria
            if (contest.criteria.specific_spot_id) {
                if (spot.id !== contest.criteria.specific_spot_id) return false;
            }

            // Geographic Restriction criteria
            const { location_latitude, location_longitude, location_radius_km } = contest.criteria;
            if (location_latitude && location_longitude && location_radius_km) {
                if (typeof spot.latitude !== 'number' || typeof spot.longitude !== 'number') {
                    return false;
                }

                const distance = getDistance(
                    { latitude: spot.latitude, longitude: spot.longitude },
                    { latitude: location_latitude, longitude: location_longitude }
                ); // Distance in meters

                const radiusInMeters = location_radius_km * 1000;

                if (distance > radiusInMeters) {
                    return false;
                }
            }

            // Spot Creator Restriction
            if (contest.criteria.require_spot_creator_is_competitor) {
                if (spot.created_by !== profile?.id) {
                    return false;
                }
            }

            // Spot Creation Time Frame Restriction
            if (contest.criteria.spot_creation_time_frame && contest.criteria.spot_creation_time_frame !== 'anytime') {
                const spotDate = new Date(spot.created_at!);
                const now = new Date();
                let thresholdDate: Date;

                switch (contest.criteria.spot_creation_time_frame) {
                    case 'during_competition':
                        thresholdDate = new Date(contest.start_date);
                        break;
                    case 'last_30_days':
                        thresholdDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
                        break;
                    case 'last_60_days':
                        thresholdDate = new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000);
                        break;
                    case 'last_90_days':
                        thresholdDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
                        break;
                    default:
                        thresholdDate = new Date(0); // Effectively anytime
                }

                if (spotDate < thresholdDate) {
                    return false;
                }
            }

            return true;
        });
    }, [userContent, favoriteSpots, contest, profile]);

    // 3. Fetch media for selected spot
    const { data: spotDetails, isLoading: mediaLoading } = useQuery({
        queryKey: ['spot-media', selectedSpotId],
        queryFn: () => spotService.fetchSpotDetails(selectedSpotId!),
        enabled: !!selectedSpotId && activeStep >= 1,
    });

    const eligibleMedia = useMemo(() => {
        if (!spotDetails?.media || !profile) return [];
        const requiredMediaTypes = contest.criteria.required_media_types || ['video'];
        const now = new Date();

        return spotDetails.media.filter(item => {
            // 1. Must be the user's media
            if (item.author.id !== profile.id) return false;

            // 2. Must match allowed types
            if (!requiredMediaTypes.includes(item.type)) return false;

            // 3. Media Creation Time Frame Restriction
            if (contest.criteria.media_creation_time_frame && contest.criteria.media_creation_time_frame !== 'anytime') {
                const mediaDate = new Date(item.createdAt);
                let thresholdDate: Date;

                switch (contest.criteria.media_creation_time_frame) {
                    case 'during_competition':
                        thresholdDate = new Date(contest.start_date);
                        break;
                    case 'last_30_days':
                        thresholdDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
                        break;
                    case 'last_60_days':
                        thresholdDate = new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000);
                        break;
                    case 'last_90_days':
                        thresholdDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
                        break;
                    default:
                        thresholdDate = new Date(0);
                }

                if (mediaDate < thresholdDate) return false;
            }

            return true;
        });
    }, [spotDetails, contest, profile]);

    const submitMutation = useMutation({
        mutationFn: () => contestService.submitEntry(
            contest.id,
            selectedSpotId!,
            selectedMediaType!,
            selectedMediaId!
        ),
        onSuccess: () => {
            console.log('Submission successful');
            queryClient.invalidateQueries({
                queryKey: ['contests', contest.id, 'entries']
            });
            onClose();
            setActiveStep(0);
            setSelectedSpotId(null);
            setSelectedMediaId(null);
        },
    });

    const handleNext = () => {
        if (activeStep === 0 && selectedSpotId) {
            setActiveStep(1);
        } else if (activeStep === 1 && selectedMediaId) {
            setActiveStep(2);
        }
    };

    const handleBack = () => {
        setActiveStep((prev) => prev - 1);
    };

    return (
        <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
            <DialogTitle sx={{ fontWeight: 'bold' }}>Submit Entry: {contest.title}</DialogTitle>
            <DialogContent dividers>
                <Stepper activeStep={activeStep} sx={{ mb: 4 }}>
                    <Step><StepLabel>Select Spot</StepLabel></Step>
                    <Step><StepLabel>Choose Media</StepLabel></Step>
                    <Step><StepLabel>Confirm</StepLabel></Step>
                </Stepper>

                {activeStep === 0 && (
                    <Box>
                        <Typography variant="subtitle1" gutterBottom fontWeight="medium">
                            Select one of your eligible spots:
                        </Typography>
                        {spotsLoading || favoritesLoading ? (
                            <Box display="flex" justifyContent="center" py={4}><CircularProgress /></Box>
                        ) : eligibleSpots && eligibleSpots.length > 0 ? (
                            <Grid container spacing={2}>
                                {eligibleSpots.map(spot => (
                                    <Grid size={{ xs: 12 }} key={spot.id}>
                                        <Card
                                            variant="outlined"
                                            sx={{
                                                borderRadius: 1,
                                                borderColor: selectedSpotId === spot.id ? 'primary.main' : 'grey.300',
                                                bgcolor: selectedSpotId === spot.id ? alpha(theme.palette.primary.main, 0.05) : 'background.paper',
                                                borderWidth: selectedSpotId === spot.id ? 2 : 1
                                            }}
                                        >
                                            <CardActionArea onClick={() => setSelectedSpotId(spot.id)}>
                                                <Box sx={{ display: 'flex', alignItems: 'center', p: 1 }}>
                                                    <CardMedia
                                                        component="img"
                                                        sx={{ width: 60, height: 60, borderRadius: 1, mr: 2 }}
                                                        image={spot.thumbnail_small_url || '/spothopIcon.png'}
                                                    />
                                                    <Box sx={{ flexGrow: 1 }}>
                                                        <Typography variant="subtitle1" fontWeight="bold">{spot.name}</Typography>
                                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                                            <Typography variant="caption" color="text.secondary">
                                                                {[spot.address, spot.city, spot.state, spot.country].filter(Boolean).join(', ')}
                                                            </Typography>
                                                            <Divider orientation="vertical" flexItem sx={{ height: 12 }} />
                                                            <Typography variant="caption" color="text.secondary">
                                                                {new Date(spot.created_at!).toLocaleDateString()}
                                                            </Typography>
                                                        </Box>
                                                        <Box sx={{ mt: 0.5, display: 'flex', gap: 0.5 }}>
                                                            {spot.spot_type?.map(type => (
                                                                <Chip
                                                                    key={type}
                                                                    label={type}
                                                                    size="small"
                                                                    sx={{ height: 18, fontSize: '0.65rem' }}
                                                                />
                                                            ))}
                                                        </Box>
                                                    </Box>
                                                    {selectedSpotId === spot.id && <CheckCircleIcon color="primary" />}
                                                </Box>
                                            </CardActionArea>
                                        </Card>
                                    </Grid>
                                ))}
                            </Grid>
                        ) : (
                            <Alert severity="warning">
                                You don't have any spots that meet the criteria for this contest yet.
                            </Alert>
                        )}
                    </Box>
                )}

                {activeStep === 1 && (
                    <Box>
                        <Typography variant="subtitle1" gutterBottom fontWeight="medium">
                            Select the best {(contest.criteria.required_media_types || ['video']).join(' or ')} for your entry:
                        </Typography>
                        {mediaLoading ? (
                            <Box display="flex" justifyContent="center" py={4}><CircularProgress /></Box>
                        ) : eligibleMedia && eligibleMedia.length > 0 ? (
                            <Grid container spacing={2}>
                                {eligibleMedia.map(item => (
                                    <Grid size={{ xs: 6 }} key={item.id}>
                                        <Card
                                            variant="outlined"
                                            sx={{
                                                borderRadius: 1,
                                                borderColor: selectedMediaId === item.id ? 'primary.main' : 'grey.300',
                                                borderWidth: selectedMediaId === item.id ? 2 : 1
                                            }}
                                        >
                                            <CardActionArea onClick={() => {
                                                setSelectedMediaId(item.id);
                                                setSelectedMediaType(item.type);
                                            }}>
                                                <Box sx={{ position: 'relative' }}>
                                                    <CardMedia
                                                        component={item.type === 'video' ? 'video' : 'img'}
                                                        height="120"
                                                        image={item.type === 'video' ? undefined : item.url}
                                                        src={item.type === 'video' ? item.url : undefined}
                                                        sx={{ bgcolor: 'black' }}
                                                    />
                                                    {item.type === 'video' && (
                                                        <Box
                                                            sx={{
                                                                position: 'absolute',
                                                                top: '50%',
                                                                left: '50%',
                                                                transform: 'translate(-50%, -50%)',
                                                                bgcolor: 'rgba(0,0,0,0.5)',
                                                                borderRadius: '50%',
                                                                p: 0.5,
                                                                display: 'flex'
                                                            }}
                                                        >
                                                            <PlayArrowIcon sx={{ color: 'white' }} />
                                                        </Box>
                                                    )}
                                                    <IconButton
                                                        size="small"
                                                        sx={{
                                                            position: 'absolute',
                                                            top: 4,
                                                            left: 4,
                                                            bgcolor: 'rgba(255,255,255,0.7)',
                                                            '&:hover': { bgcolor: 'white' }
                                                        }}
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            setFullscreenMedia(item);
                                                        }}
                                                    >
                                                        <FullscreenIcon fontSize="small" />
                                                    </IconButton>
                                                </Box>
                                                {selectedMediaId === item.id && (
                                                    <Box sx={{ position: 'absolute', top: 8, right: 8, bgcolor: 'background.paper', borderRadius: '50%', display: 'flex' }}>
                                                        <CheckCircleIcon color="primary" />
                                                    </Box>
                                                )}
                                            </CardActionArea>
                                        </Card>
                                    </Grid>
                                ))}
                            </Grid>
                        ) : (
                            <Alert severity="error">
                                This spot has no eligible {(contest.criteria.required_media_types || ['video']).join(' or ')}.
                            </Alert>
                        )}
                    </Box>
                )}

                {activeStep === 2 && (() => {
                    const selectedMedia = eligibleMedia.find(m => m.id === selectedMediaId);
                    const spot = spotDetails || eligibleSpots?.find(s => s.id === selectedSpotId);

                    const addressParts = [
                        spot?.address,
                        spot?.city,
                        spot?.state,
                        spot?.country
                    ].filter(Boolean);

                    const fullAddress = addressParts.join(', ');

                    return (
                        <Box textAlign="center">
                            <Typography variant="h5" gutterBottom fontWeight="bold">Ready to submit?</Typography>

                            <Card variant="outlined" sx={{ mb: 2, borderRadius: 1, overflow: 'hidden' }}>
                                <Box sx={{ position: 'relative', bgcolor: 'black' }}>
                                    <CardMedia
                                        component={selectedMediaType === 'video' ? 'video' : 'img'}
                                        height="200"
                                        image={selectedMediaType === 'video' ? undefined : selectedMedia?.url}
                                        src={selectedMediaType === 'video' ? selectedMedia?.url : undefined}
                                        controls={selectedMediaType === 'video'}
                                        onPlay={() => setIsVideoPlaying(true)}
                                        onPause={() => setIsVideoPlaying(false)}
                                    />
                                    {selectedMediaType === 'video' && !isVideoPlaying && (
                                        <Box
                                            sx={{
                                                position: 'absolute',
                                                top: '50%',
                                                left: '50%',
                                                transform: 'translate(-50%, -50%)',
                                                pointerEvents: 'none'
                                            }}
                                        >
                                            <PlayArrowIcon sx={{ color: 'white', fontSize: 60, opacity: 0.7 }} />
                                        </Box>
                                    )}
                                </Box>
                                <CardContent>
                                    <Typography variant="h6">
                                        {spot?.name}
                                    </Typography>
                                    {mediaLoading && !spotDetails ? (
                                        <CircularProgress size={16} />
                                    ) : (
                                        <Typography variant="body2" color="text.secondary">
                                            {fullAddress}
                                        </Typography>
                                    )}
                                </CardContent>
                            </Card>

                            <Divider sx={{ my: 2 }} />
                            {submitMutation.isError && (
                                <Alert severity="error" sx={{ mb: 2 }}>
                                    {(submitMutation.error as Error).message}
                                </Alert>
                            )}
                            <Typography variant="caption">
                                Note: Once submitted, you cannot change your entry.
                            </Typography>
                        </Box>
                    );
                })()}
            </DialogContent>
            <DialogActions sx={{ px: 3, py: 2 }}>
                <Button onClick={onClose} color="inherit">Cancel</Button>
                <Box sx={{ flex: '1 1 auto' }} />
                {activeStep > 0 && (
                    <Button onClick={handleBack} sx={{ mr: 1 }}>Back</Button>
                )}
                {activeStep < 2 ? (
                    (activeStep !== 0 || (eligibleSpots && eligibleSpots.length > 0)) && (
                        <Button
                            variant="contained"
                            onClick={handleNext}
                            disabled={(activeStep === 0 && !selectedSpotId) || (activeStep === 1 && !selectedMediaId)}
                        >
                            Next
                        </Button>
                    )
                ) : (
                    <Button
                        variant="contained"
                        color="primary"
                        onClick={() => submitMutation.mutate()}
                        loading={submitMutation.isPending}
                    >
                        Confirm Submission
                    </Button>
                )}
            </DialogActions>

            <Dialog
                open={!!fullscreenMedia}
                onClose={() => setFullscreenMedia(null)}
                maxWidth="lg"
                fullWidth
            >
                <Box sx={{ position: 'relative', bgcolor: 'black', minHeight: 400, display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                    <IconButton
                        onClick={() => setFullscreenMedia(null)}
                        sx={{ position: 'absolute', top: 8, right: 8, color: 'white', zIndex: 1 }}
                    >
                        <CloseIcon />
                    </IconButton>
                    {fullscreenMedia?.type === 'video' ? (
                        <video
                            src={fullscreenMedia.url}
                            controls
                            autoPlay
                            style={{ width: '100%', maxHeight: '80vh' }}
                        />
                    ) : (
                        <img
                            src={fullscreenMedia?.url}
                            style={{ width: '100%', maxHeight: '80vh', objectFit: 'contain' }}
                        />
                    )}
                </Box>
            </Dialog>
        </Dialog>
    );
}