import {
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Box,
    Button,
    IconButton,
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import type { VideoAsset } from 'src/types';

interface VideoPreviewDialogProps {
    open: boolean;
    onClose: () => void;
    asset: VideoAsset | null;
}

export function VideoPreviewDialog({ open, onClose, asset }: VideoPreviewDialogProps) {
    if (!asset) return null;

    return (
        <Dialog
            open={open}
            onClose={onClose}
            maxWidth="md"
            fullWidth
        >
            <DialogTitle>
                Video Preview
                <IconButton
                    onClick={onClose}
                    sx={{ position: 'absolute', right: 8, top: 8 }}
                >
                    <CloseIcon />
                </IconButton>
            </DialogTitle>
            <DialogContent>
                <Box sx={{ position: 'relative', width: '100%', pt: '56.25%', bgcolor: 'black', borderRadius: 1, overflow: 'hidden' }}>
                    <video
                        src={URL.createObjectURL(asset.file)}
                        controls
                        autoPlay
                        style={{
                            position: 'absolute',
                            top: 0,
                            left: 0,
                            width: '100%',
                            height: '100%',
                            objectFit: 'contain'
                        }}
                    />
                </Box>
            </DialogContent>
            <DialogActions>
                <Button onClick={onClose}>Close</Button>
            </DialogActions>
        </Dialog>
    );
}
