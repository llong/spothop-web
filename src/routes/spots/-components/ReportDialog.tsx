import { useState } from 'react';
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
    CircularProgress,
    Alert
} from '@mui/material';
import supabase from 'src/supabase';
import { useAtomValue } from 'jotai';
import { userAtom } from 'src/atoms/auth';
import type { SpotFlagReason } from 'src/types';

interface ReportDialogProps {
    open: boolean;
    onClose: () => void;
    targetId: string;
    targetType: 'spot' | 'comment' | 'media';
    targetName: string;
    onSuccess: () => void;
}

export const ReportDialog = ({ open, onClose, targetId, targetType, targetName, onSuccess }: ReportDialogProps) => {
    const user = useAtomValue(userAtom);
    const [reason, setReason] = useState<SpotFlagReason>('inappropriate_content');
    const [details, setDetails] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleSubmit = async () => {
        if (!user?.user.id) return;

        try {
            setIsSubmitting(true);
            setError(null);

            const { error: reportError } = await supabase
                .from('content_reports')
                .insert({
                    user_id: user.user.id,
                    target_id: targetId,
                    target_type: targetType,
                    reason,
                    details: reason === 'other' ? details : undefined
                });

            if (reportError) throw reportError;

            onSuccess();
            onClose();
            // Reset state
            setReason('inappropriate_content');
            setDetails('');
        } catch (err: any) {
            console.error('Error submitting report:', err);
            setError(err.message || 'Failed to submit report. Please try again.');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <Dialog open={open} onClose={onClose} fullWidth maxWidth="xs">
            <DialogTitle>Report {targetType}: {targetName}</DialogTitle>
            <DialogContent dividers>
                {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
                <FormControl component="fieldset">
                    <FormLabel component="legend">Reason for reporting</FormLabel>
                    <RadioGroup
                        aria-label="report-reason"
                        name="report-reason"
                        value={reason}
                        onChange={(e) => setReason(e.target.value as SpotFlagReason)}
                    >
                        <FormControlLabel value="inappropriate_content" control={<Radio />} label="Inappropriate Content" />
                        <FormControlLabel value="incorrect_information" control={<Radio />} label="Incorrect Information" />
                        <FormControlLabel value="spot_no_longer_exists" control={<Radio />} label="No longer exists" />
                        <FormControlLabel value="duplicate_spot" control={<Radio />} label="Duplicate" />
                        <FormControlLabel value="other" control={<Radio />} label="Other" />
                    </RadioGroup>
                </FormControl>

                {reason === 'other' && (
                    <TextField
                        autoFocus
                        margin="dense"
                        label="Provide more details"
                        type="text"
                        fullWidth
                        multiline
                        rows={3}
                        variant="outlined"
                        value={details}
                        onChange={(e) => setDetails(e.target.value)}
                        sx={{ mt: 2 }}
                    />
                )}
            </DialogContent>
            <DialogActions>
                <Button onClick={onClose} disabled={isSubmitting}>Cancel</Button>
                <Button
                    onClick={handleSubmit}
                    color="error"
                    variant="contained"
                    disabled={isSubmitting || (reason === 'other' && !details.trim())}
                >
                    {isSubmitting ? <CircularProgress size={24} color="inherit" /> : 'Submit Report'}
                </Button>
            </DialogActions>
        </Dialog>
    );
};
