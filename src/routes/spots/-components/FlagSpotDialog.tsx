import React, { useState } from 'react';
import {
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Button,
    FormControl,
    FormLabel,
    RadioGroup,
    FormControlLabel,
    Radio,
    TextField,
    Alert,
    Box,
    Typography
} from '@mui/material';
import { useFlagging } from 'src/hooks/useFlagging';
import { SPOT_FLAG_REASONS, type SpotFlagReason } from 'src/types';
import { useQueryClient } from '@tanstack/react-query';
import { spotKeys } from 'src/hooks/useSpotQueries';

interface FlagSpotDialogProps {
    spotId: string;
    spotName: string;
    open: boolean;
    onClose: () => void;
    onSuccess: () => void;
}

export const FlagSpotDialog = ({ spotId, spotName, open, onClose, onSuccess }: FlagSpotDialogProps) => {
    const [reason, setReason] = useState<SpotFlagReason>('inappropriate_content');
    const [details, setDetails] = useState('');
    const { flagSpot, loading, error, setError } = useFlagging();
    const queryClient = useQueryClient();

    const handleSubmit = async () => {
        console.log('Submitting report for spot:', spotId, reason, details);
        const success = await flagSpot(spotId, reason, details);
        if (success) {
            console.log('Report submitted successfully');

            // Add a small delay to ensure DB consistency before refetch
            setTimeout(() => {
                queryClient.invalidateQueries({ queryKey: spotKeys.details(spotId) });
            }, 500);

            setDetails('');
            setReason('inappropriate_content');
            onSuccess();
            onClose();
        } else {
            console.error('Report submission failed');
        }
    };

    const handleReasonChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        setReason(event.target.value as SpotFlagReason);
        setDetails('');
        setError(null);
    };

    return (
        <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
            <DialogTitle>Report Spot: {spotName}</DialogTitle>
            <DialogContent>
                <Box sx={{ mt: 1 }}>
                    <Typography variant="body2" color="text.secondary" gutterBottom>
                        Help us maintain the community by reporting spots that are inappropriate, incorrect, or no longer exist.
                    </Typography>

                    {error && (
                        <Alert severity="error" sx={{ mb: 2 }}>
                            {error}
                        </Alert>
                    )}

                    <FormControl component="fieldset" fullWidth sx={{ mt: 2 }}>
                        <FormLabel component="legend">Reason for reporting</FormLabel>
                        <RadioGroup
                            aria-label="flag-reason"
                            name="flag-reason"
                            value={reason}
                            onChange={handleReasonChange}
                        >
                            {Object.entries(SPOT_FLAG_REASONS).map(([key, label]) => (
                                <FormControlLabel
                                    key={key}
                                    value={key}
                                    control={<Radio size="small" />}
                                    label={label}
                                />
                            ))}
                        </RadioGroup>
                    </FormControl>

                    <TextField
                        fullWidth
                        label={reason === 'other' ? 'Please specify (required)' : 'Additional details (optional)'}
                        multiline
                        rows={3}
                        value={details}
                        onChange={(e) => setDetails(e.target.value)}
                        placeholder="Provide more context here..."
                        sx={{ mt: 2 }}
                        required={reason === 'other'}
                        error={reason === 'other' && error?.includes('specifying "Other"')}
                    />
                </Box>
            </DialogContent>
            <DialogActions sx={{ px: 3, pb: 3 }}>
                <Button onClick={onClose} disabled={loading}>
                    Cancel
                </Button>
                <Button
                    onClick={handleSubmit}
                    variant="contained"
                    color="error"
                    disabled={loading || (reason === 'other' && !details.trim())}
                >
                    {loading ? 'Submitting...' : 'Submit Report'}
                </Button>
            </DialogActions>
        </Dialog>
    );
};
