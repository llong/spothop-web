import { useState, useEffect } from 'react';
import {
    Dialog, DialogTitle, DialogContent, DialogActions,
    TextField, Button, Box, Alert, CircularProgress, Typography,
    Autocomplete
} from '@mui/material';
import { parseYoutubeId, timeToSeconds, secondsToTime } from 'src/utils/youtube';
import { spotService } from 'src/services/spotService';
import type { SpotVideoLink } from 'src/types';

interface AddVideoLinkDialogProps {
    open: boolean;
    onClose: () => void;
    spotId: string;
    userId: string;
    onSuccess: () => void;
    editLink?: SpotVideoLink;
}

export const AddVideoLinkDialog = ({ open, onClose, spotId, userId, onSuccess, editLink }: AddVideoLinkDialogProps) => {
    const isEdit = !!editLink;
    const [url, setUrl] = useState('');
    const [startTime, setStartTime] = useState('');
    const [endTime, setEndTime] = useState('');
    const [description, setDescription] = useState('');
    const [skaterName, setSkaterName] = useState('');
    const [skaterOptions, setSkaterOptions] = useState<string[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Pre-fill if editing
    useEffect(() => {
        if (editLink && open) {
            setUrl(`https://www.youtube.com/watch?v=${editLink.youtube_video_id}`);
            setStartTime(secondsToTime(editLink.start_time));
            setEndTime(editLink.end_time ? secondsToTime(editLink.end_time) : '');
            setDescription(editLink.description || '');
            setSkaterName(editLink.skater_name || '');
        } else if (!open) {
            // Reset on close if not editing
            if (!isEdit) {
                setUrl('');
                setStartTime('');
                setEndTime('');
                setDescription('');
                setSkaterName('');
            }
        }
    }, [editLink, open, isEdit]);

    // Fetch suggestions as user types
    useEffect(() => {
        const fetchSuggestions = async () => {
            if (skaterName.length >= 2) {
                try {
                    const suggestions = await spotService.fetchSkaterSuggestions(skaterName);
                    setSkaterOptions(suggestions);
                } catch (err) {
                    console.error('Failed to fetch skater suggestions', err);
                }
            } else {
                setSkaterOptions([]);
            }
        };

        const timer = setTimeout(fetchSuggestions, 300);
        return () => clearTimeout(timer);
    }, [skaterName]);

    const handleSubmit = async () => {
        setError(null);
        
        const videoId = parseYoutubeId(url);
        if (!videoId) {
            setError('Invalid YouTube URL');
            return;
        }

        const startSeconds = timeToSeconds(startTime);
        if (startSeconds === null) {
            setError('Invalid Start Time (use MM:SS or seconds)');
            return;
        }

        const endSeconds = endTime ? timeToSeconds(endTime) : undefined;
        if (endSeconds !== undefined && endSeconds !== null && endSeconds <= startSeconds) {
            setError('End Time must be after Start Time');
            return;
        }

        setLoading(true);
        try {
            if (isEdit && editLink) {
                await spotService.updateVideoLink(editLink.id, videoId, startSeconds, endSeconds || undefined, description, skaterName);
            } else {
                await spotService.addVideoLink(spotId, userId, videoId, startSeconds, endSeconds || undefined, description, skaterName);
            }
            
            if (!isEdit) {
                setUrl('');
                setStartTime('');
                setEndTime('');
                setDescription('');
                setSkaterName('');
            }
            onSuccess();
            onClose();
        } catch (err: any) {
            console.error(err);
            setError(err.message || 'Failed to add video link');
        } finally {
            setLoading(false);
        }
    };

    return (
        <Dialog open={open} onClose={loading ? undefined : onClose} maxWidth="sm" fullWidth>
            <DialogTitle>{isEdit ? 'Edit Pro Video Part' : 'Link Pro Video Part'}</DialogTitle>
            <DialogContent>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
                    {error && <Alert severity="error">{error}</Alert>}
                    
                    <TextField
                        label="YouTube URL"
                        placeholder="https://www.youtube.com/watch?v=..."
                        value={url}
                        onChange={(e) => setUrl(e.target.value)}
                        fullWidth
                        autoFocus
                    />

                    <Box sx={{ display: 'flex', gap: 2 }}>
                        <TextField
                            label="Start Time"
                            placeholder="MM:SS (e.g. 2:45)"
                            value={startTime}
                            onChange={(e) => setStartTime(e.target.value)}
                            fullWidth
                            helperText="When does the trick happen?"
                        />
                        <TextField
                            label="End Time (Optional)"
                            placeholder="MM:SS"
                            value={endTime}
                            onChange={(e) => setEndTime(e.target.value)}
                            fullWidth
                            helperText="When does it end?"
                        />
                    </Box>

                    <Autocomplete
                        freeSolo
                        options={skaterOptions}
                        value={skaterName}
                        onInputChange={(_, newValue) => setSkaterName(newValue)}
                        renderInput={(params) => (
                            <TextField
                                {...params}
                                label="Skater Name (Optional)"
                                placeholder="e.g. Tony Hawk"
                                fullWidth
                            />
                        )}
                    />

                    <TextField
                        label="Description"
                        placeholder="e.g. Thrasher - My Part (Kickflip)"
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        fullWidth
                        multiline
                        rows={2}
                    />
                    
                    <Typography variant="caption" color="text.secondary">
                        Tip: You can use MM:SS format or just seconds.
                    </Typography>
                </Box>
            </DialogContent>
            <DialogActions>
                <Button onClick={onClose} disabled={loading}>Cancel</Button>
                <Button 
                    onClick={handleSubmit} 
                    variant="contained" 
                    disabled={loading || !url || !startTime}
                    startIcon={loading && <CircularProgress size={20} />}
                >
                    {isEdit ? 'Save Changes' : 'Add Link'}
                </Button>
            </DialogActions>
        </Dialog>
    );
};
