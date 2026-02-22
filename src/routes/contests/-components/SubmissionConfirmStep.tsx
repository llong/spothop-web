import {
    Card,
    CardMedia,
    CardContent,
    Typography,
    Box,
    Divider,
    Alert,
    CircularProgress,
} from '@mui/material';
import {
    PlayArrow as PlayArrowIcon,
} from '@mui/icons-material';
import { useState } from 'react';

interface SubmissionConfirmStepProps {
    selectedMediaId: string | null;
    eligibleMedia: any[];
    spotDetails: any;
    eligibleSpots: any[];
    selectedSpotId: string | null;
    selectedMediaType: 'photo' | 'video' | null;
    mediaLoading: boolean;
    submitError: Error | null;
}

export function SubmissionConfirmStep({
    selectedMediaId,
    eligibleMedia,
    spotDetails,
    eligibleSpots,
    selectedSpotId,
    selectedMediaType,
    mediaLoading,
    submitError,
}: SubmissionConfirmStepProps) {
    const [isVideoPlaying, setIsVideoPlaying] = useState(false);
    
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
            {submitError && (
                <Alert severity="error" sx={{ mb: 2 }}>
                    {submitError.message}
                </Alert>
            )}
            <Typography variant="caption">
                Note: Once submitted, you cannot change your entry.
            </Typography>
        </Box>
    );
}
