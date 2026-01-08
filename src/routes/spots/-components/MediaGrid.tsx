import { Dialog, DialogTitle, DialogContent, IconButton, Grid } from '@mui/material';
import { Close } from '@mui/icons-material';
import { MediaCard } from './MediaCard';
import type { MediaItem } from 'src/types';

interface MediaGridProps {
    open: boolean;
    onClose: () => void;
    mediaItems: MediaItem[];
    onToggleLike: (item: MediaItem) => void;
    loadingStates: Record<string, boolean>;
    onSelect: (index: number) => void;
    isMobile: boolean;
}

export const MediaGrid = ({
    open,
    onClose,
    mediaItems,
    onToggleLike,
    loadingStates,
    onSelect,
    isMobile
}: MediaGridProps) => (
    <Dialog
        fullScreen={isMobile}
        open={open}
        onClose={onClose}
        maxWidth="lg"
        fullWidth
    >
        <DialogTitle sx={{ m: 0, p: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            All Media ({mediaItems.length})
            <IconButton onClick={onClose} aria-label="Close gallery">
                <Close />
            </IconButton>
        </DialogTitle>
        <DialogContent dividers sx={{ bgcolor: 'grey.50' }}>
            <Grid container spacing={2}>
                {mediaItems.map((item, index) => (
                    <Grid size={{ xs: 12, sm: 6, md: 4 }} key={item.id}>
                        <MediaCard
                            item={item}
                            onToggleLike={() => onToggleLike(item)}
                            isLoading={loadingStates[item.id]}
                            onSelect={() => onSelect(index)}
                        />
                    </Grid>
                ))}
            </Grid>
        </DialogContent>
    </Dialog>
);
