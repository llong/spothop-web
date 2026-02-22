import {
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Button,
    Grid,
    Divider,
} from '@mui/material';
import { ImageUploader } from '@/components/ImageUploader';
import { useContestForm } from '../hooks/useContestForm';
import { ContestBasicInfoFields } from './ContestBasicInfoFields';
import { ContestStatusVotingFields } from './ContestStatusVotingFields';
import { ContestSubmissionCriteriaFields } from './ContestSubmissionCriteriaFields';
import { ContestUsageRestrictionFields } from './ContestUsageRestrictionFields';
import type { Contest } from '../../../types';

interface ContestFormDialogProps {
    open: boolean;
    onClose: () => void;
    contest: Contest | null;
}

export function ContestFormDialog({ open, onClose, contest }: ContestFormDialogProps) {
    const {
        formData,
        setFlyerFile,
        judgeSearchResults,
        selectedJudges,
        radiusUnit,
        setRadiusUnit,
        handleChange,
        handleCriteriaChange,
        debouncedJudgeSearch,
        saveContest,
        isSaving,
        setSelectedJudges
    } = useContestForm(contest, onClose);

    if (!open) return null;

    return (
        <Dialog open={open} onClose={onClose} fullWidth maxWidth="md">
            <DialogTitle>{contest ? 'Edit Contest' : 'Create New Contest'}</DialogTitle>
            <DialogContent dividers>
                <Grid container spacing={3}>
                    <Grid size={{ xs: 12, md: 8 }}>
                        <ContestBasicInfoFields
                            formData={formData}
                            onChange={handleChange}
                        />
                    </Grid>
                    <Grid size={{ xs: 12, md: 4 }}>
                        <ImageUploader
                            label="Contest Flyer"
                            initialImageUrl={formData.flyer_url}
                            onImageUpload={setFlyerFile}
                            loading={isSaving}
                        />
                    </Grid>

                    <Grid size={{ xs: 12 }}><Divider /></Grid>

                    <ContestStatusVotingFields
                        formData={formData}
                        onChange={handleChange}
                        judgeSearchResults={judgeSearchResults}
                        selectedJudges={selectedJudges}
                        onJudgesChange={(newJudges) => {
                            setSelectedJudges(newJudges);
                            handleCriteriaChange('judges', newJudges.map(j => j.id));
                        }}
                        onJudgeSearch={debouncedJudgeSearch}
                    />

                    <Grid size={{ xs: 12, sm: 6 }}>
                        <ContestSubmissionCriteriaFields
                            formData={formData}
                            onCriteriaChange={handleCriteriaChange}
                            radiusUnit={radiusUnit}
                            onRadiusUnitChange={setRadiusUnit}
                            onLocationSearch={(loc) => {
                                if (loc) {
                                    handleCriteriaChange('location_latitude', loc.lat);
                                    handleCriteriaChange('location_longitude', loc.lng);
                                }
                            }}
                        />
                    </Grid>

                    <ContestUsageRestrictionFields
                        formData={formData}
                        onCriteriaChange={handleCriteriaChange}
                    />
                </Grid>
            </DialogContent>
            <DialogActions sx={{ p: 2 }}>
                <Button onClick={onClose} color="inherit">Cancel</Button>
                <Button
                    variant="contained"
                    onClick={saveContest}
                    disabled={isSaving}
                    sx={{ px: 4, borderRadius: 2 }}
                >
                    Save Contest
                </Button>
            </DialogActions>
        </Dialog>
    );
}
