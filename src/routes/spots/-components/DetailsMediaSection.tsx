import { useState, Suspense } from 'react';
import {
    Box,
    Typography,
    Stack,
    Tabs,
    Tab,
} from '@mui/material';
import MovieFilterIcon from '@mui/icons-material/MovieFilter';
import type { Spot, MediaItem } from 'src/types';
import { MediaListItem } from './MediaListItem';
import { MediaSectionSkeleton } from './SpotCardSkeleton';
import { ProPartsTab } from './ProParts/ProPartsTab';

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

    // Guard against spot.media being undefined
    const filteredMedia = spot.media?.filter((m: MediaItem) => (mediaTab === 0 ? m.type === 'photo' : m.type === 'video')) || [];
    const proPartsCount = spot.videoLinks?.length || 0;

    console.log('[DetailsMediaSection] Media:', spot.media?.length, 'Pro Parts:', proPartsCount);

    return (
        <Box>
            <Tabs
                value={mediaTab}
                onChange={(_: React.SyntheticEvent, v: number) => setMediaTab(v)}
                variant="scrollable"
                scrollButtons="auto"
                sx={{
                    minHeight: 0,
                    borderBottom: 1,
                    borderColor: 'divider',
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
                <Tab 
                    icon={<MovieFilterIcon fontSize="small" />} 
                    iconPosition="start"
                    label={`Pro History (${proPartsCount})`} 
                    sx={{ 
                        '&.Mui-selected': { color: '#DAA520' }, // Gold color for selected
                        '& .MuiSvgIcon-root': { color: '#DAA520' } // Gold icon always
                    }}
                />
            </Tabs>

            <Box sx={{ mt: 2 }}>
                <Suspense fallback={<MediaSectionSkeleton />}>
                    {mediaTab === 2 ? (
                        <ProPartsTab spot={spot} currentUserId={currentUserId} />
                    ) : (
                        <Stack spacing={2}>
                            {filteredMedia.map((item: MediaItem, index: number) => {
                                // Calculate global index for lightbox (photos first, then videos)
                                const globalIndex = spot.media?.indexOf(item) ?? index; 
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
                    )}
                </Suspense>
            </Box>
        </Box>
    );
};
