import { useState, Suspense } from 'react'; // Added Suspense
import {
    Box,
    Typography,
    Stack,
    Tabs,
    Tab,
} from '@mui/material';
import type { Spot, MediaItem } from 'src/types';
import { MediaListItem } from './MediaListItem';
import { MediaSectionSkeleton } from './SpotCardSkeleton'; // Import skeleton

interface DetailsMediaSectionProps {
    spot: Spot;
    currentUserId?: string;
    onLike: (id: string, type: 'photo' | 'video') => void;
    onComment: (item: MediaItem) => void;
    onShare: () => void;
    onItemClick: (index: number) => void;
}

export const DetailsMediaSection = ({ spot, currentUserId, onLike, onComment, onShare, onItemClick }: DetailsMediaSectionProps) => {
    const [mediaTab, setMediaTab] = useState(0);

    // Guard against spot.media being undefined, though it should be available after loader
    // This allows TS to be happy and provides a graceful fallback if logic outside fails
    const filteredMedia = spot.media?.filter((m: MediaItem) => (mediaTab === 0 ? m.type === 'photo' : m.type === 'video')) || [];

    return (
        <Box>
            <Tabs
                value={mediaTab}
                onChange={(_: React.SyntheticEvent, v: number) => setMediaTab(v)}
                sx={{
                    minHeight: 0,
                    '& .MuiTab-root': {
                        textTransform: 'none',
                        fontWeight: 700,
                        minHeight: 40,
                        fontSize: '0.9rem'
                    }
                }}
            >
                <Tab label={`Photos (${spot.media?.filter((m: MediaItem) => m.type === 'photo').length || 0})`} />
                <Tab label={`Videos (${spot.media?.filter((m: MediaItem) => m.type === 'video').length || 0})`} />
            </Tabs>

            <Box sx={{ mt: 2 }}>
                <Suspense fallback={<MediaSectionSkeleton />}>
                    <Stack spacing={2}>
                        {filteredMedia.map((item: MediaItem, index: number) => {
                            const globalIndex = spot.media?.indexOf(item) ?? index; // Fallback index
                            return (
                                <MediaListItem
                                    key={item.id}
                                    item={item}
                                    currentUserId={currentUserId}
                                    onLike={(id, type) => onLike(id, type)}
                                    onComment={onComment}
                                    onShare={onShare}
                                    onClick={() => onItemClick(globalIndex)}
                                />
                            );
                        })}
                        {filteredMedia.length === 0 && (
                            <Typography variant="body2" color="text.secondary" sx={{ py: 4, textAlign: 'center' }}>
                                No {mediaTab === 0 ? 'photos' : 'videos'} available
                            </Typography>
                        )}
                    </Stack>
                </Suspense>
            </Box>
        </Box>
    );
};
