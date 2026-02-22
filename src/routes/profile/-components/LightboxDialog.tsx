import {
    Dialog,
    DialogContent,
    IconButton,
    Box,
    Typography,
} from '@mui/material';
import {
    Close,
    ChevronLeft,
    ChevronRight,
} from '@mui/icons-material';
import { Link } from '@tanstack/react-router';
import { format } from 'date-fns';
import type { UserMediaItem } from 'src/types';

interface LightboxDialogProps {
    open: boolean;
    onClose: () => void;
    currentMedia: UserMediaItem | null;
    onNext: () => void;
    onPrev: () => void;
    hasMultiple: boolean;
}

export function LightboxDialog({
    open,
    onClose,
    currentMedia,
    onNext,
    onPrev,
    hasMultiple,
}: LightboxDialogProps) {
    if (!currentMedia) return null;

    return (
        <Dialog
            open={open}
            onClose={onClose}
            maxWidth="md"
            fullWidth
            PaperProps={{
                sx: { bgcolor: 'black', position: 'relative', m: 0, maxHeight: '90vh' }
            }}
        >
            <IconButton
                onClick={onClose}
                sx={{ position: 'absolute', right: 8, top: 8, color: 'white', zIndex: 1 }}
            >
                <Close />
            </IconButton>

            <DialogContent sx={{ p: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 400 }}>
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

                    {hasMultiple && (
                        <>
                            <IconButton
                                onClick={(e) => { e.stopPropagation(); onPrev(); }}
                                sx={{ position: 'absolute', left: 8, top: '50%', transform: 'translateY(-50%)', color: 'white', bgcolor: 'rgba(255,255,255,0.1)', '&:hover': { bgcolor: 'rgba(255,255,255,0.2)' } }}
                            >
                                <ChevronLeft fontSize="large" />
                            </IconButton>
                            <IconButton
                                onClick={(e) => { e.stopPropagation(); onNext(); }}
                                sx={{ position: 'absolute', right: 8, top: '50%', transform: 'translateY(-50%)', color: 'white', bgcolor: 'rgba(255,255,255,0.1)', '&:hover': { bgcolor: 'rgba(255,255,255,0.2)' } }}
                            >
                                <ChevronRight fontSize="large" />
                            </IconButton>
                        </>
                    )}
                </Box>
            </DialogContent>

            <Box sx={{ p: 2, bgcolor: 'rgba(0,0,0,0.8)', color: 'white' }}>
                <Link to="/spots/$spotId" params={{ spotId: currentMedia.spot.id }} onClick={onClose} style={{ textDecoration: 'none', color: 'inherit' }}>
                    <Typography variant="subtitle1" fontWeight={700}>
                        {currentMedia.spot.name}
                    </Typography>
                </Link>
                <Typography variant="caption" sx={{ opacity: 0.8 }}>
                    {[
                        [currentMedia.spot.city, (currentMedia.spot as any).state].filter(Boolean).join(', '),
                        currentMedia.spot.country
                    ].filter(Boolean).join(', ') || 'Unknown Location'} • {format(new Date(currentMedia.created_at), 'PPP')}
                </Typography>
            </Box>
        </Dialog>
    );
}
