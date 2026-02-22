import {
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Button,
    Typography,
    IconButton,
    Box,
    Grid,
    CircularProgress,
    Alert,
    Stepper,
    Step,
    StepLabel,
} from '@mui/material';
import {
    Close as CloseIcon,
} from '@mui/icons-material';
import { useState } from 'react';
import { useContestSubmission } from '../hooks/useContestSubmission';
import { SpotSelectionCard } from './SpotSelectionCard';
import { MediaSelectionCard } from './MediaSelectionCard';
import { SubmissionConfirmStep } from './SubmissionConfirmStep';
import type { Contest } from "@/types";

interface Props {
    open: boolean;
    onClose: () => void;
    contest: Contest;
}

export function ContestSubmissionModal({ open, onClose, contest }: Props) {
    const [fullscreenMedia, setFullscreenMedia] = useState<{ url: string; type: 'photo' | 'video' } | null>(null);

    const {
        activeStep,
        setActiveStep,
        selectedSpotId,
        setSelectedSpotId,
        selectedMediaId,
        setSelectedMediaId,
        selectedMediaType,
        setSelectedMediaType,
        eligibleSpots,
        eligibleMedia,
        spotDetails,
        spotsLoading,
        favoritesLoading,
        mediaLoading,
        submitEntry,
        isSubmitting,
        submitError,
    } = useContestSubmission(contest, open, onClose);

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

    if (!open) return null;

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
                                        <SpotSelectionCard
                                            spot={spot}
                                            isSelected={selectedSpotId === spot.id}
                                            onSelect={setSelectedSpotId}
                                        />
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
                                        <MediaSelectionCard
                                            item={item}
                                            isSelected={selectedMediaId === item.id}
                                            onSelect={(id, type) => {
                                                setSelectedMediaId(id);
                                                setSelectedMediaType(type);
                                            }}
                                            onFullscreen={setFullscreenMedia}
                                        />
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

                {activeStep === 2 && (
                    <SubmissionConfirmStep
                        selectedMediaId={selectedMediaId}
                        eligibleMedia={eligibleMedia}
                        spotDetails={spotDetails}
                        eligibleSpots={eligibleSpots}
                        selectedSpotId={selectedSpotId}
                        selectedMediaType={selectedMediaType}
                        mediaLoading={mediaLoading}
                        submitError={submitError}
                    />
                )}
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
                        onClick={() => submitEntry()}
                        loading={isSubmitting}
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
