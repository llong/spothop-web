import { useState } from 'react';
import {
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Button,
    Box,
    Typography,
    Divider,
    Stack,
    CircularProgress,
    Alert
} from '@mui/material';
import { PhotoUpload } from './PhotoUpload';
import { VideoUpload } from './VideoUpload';
import { useMediaUpload } from 'src/hooks/useMediaUpload';
import type { VideoAsset } from 'src/types';

interface AddMediaDialogProps {
    spotId: string;
    spotName: string;
    open: boolean;
    onClose: () => void;
    onSuccess: () => void;
    user: any;
}

export const AddMediaDialog = ({ spotId, spotName, open, onClose, onSuccess, user }: AddMediaDialogProps) => {
    const [selectedPhotos, setSelectedPhotos] = useState<File[]>([]);
    const [selectedVideos, setSelectedVideos] = useState<VideoAsset[]>([]);
    const [isUploading, setIsUploading] = useState(false);
    const [statusMessage, setStatusMessage] = useState('');
    const [error, setError] = useState<string | null>(null);

    const { uploadMedia } = useMediaUpload({ user, setStatusMessage });

    const handleSubmit = async () => {
        if (selectedPhotos.length === 0 && selectedVideos.length === 0) {
            setError('Please select at least one photo or video to upload.');
            return;
        }

        try {
            setIsUploading(true);
            setError(null);

            await uploadMedia(spotId, selectedPhotos, selectedVideos);

            onSuccess();
            handleClose();
        } catch (err: any) {
            console.error('Error uploading media:', err);
            setError(err.message || 'Failed to upload media. Please try again.');
            setIsUploading(false);
        }
    };

    const handleClose = () => {
        if (isUploading) return;
        setSelectedPhotos([]);
        setSelectedVideos([]);
        setError(null);
        setStatusMessage('');
        onClose();
    };

    return (
        <Dialog open={open} onClose={handleClose} fullWidth maxWidth="sm">
            <DialogTitle>Add Media to {spotName}</DialogTitle>
            <DialogContent dividers>
                <Stack spacing={3}>
                    {error && <Alert severity="error">{error}</Alert>}

                    <Box>
                        <Typography variant="subtitle2" gutterBottom fontWeight={600}>
                            Photos
                        </Typography>
                        <PhotoUpload onFilesSelect={setSelectedPhotos} />
                    </Box>

                    <Divider />

                    <Box>
                        <Typography variant="subtitle2" gutterBottom fontWeight={600}>
                            Videos
                        </Typography>
                        <VideoUpload onFilesSelect={setSelectedVideos} />
                    </Box>
                </Stack>
            </DialogContent>
            <DialogActions sx={{ px: 3, py: 2 }}>
                <Button onClick={handleClose} disabled={isUploading}>
                    Cancel
                </Button>
                <Button
                    onClick={handleSubmit}
                    variant="contained"
                    disabled={isUploading || (selectedPhotos.length === 0 && selectedVideos.length === 0)}
                    startIcon={isUploading ? <CircularProgress size={20} color="inherit" /> : null}
                >
                    {isUploading ? statusMessage || 'Uploading...' : 'Upload Media'}
                </Button>
            </DialogActions>
        </Dialog>
    );
};
