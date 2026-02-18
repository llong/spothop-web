import { useState } from 'react';
import { Box, Button, Typography, Stack } from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import type { Spot, SpotVideoLink } from 'src/types';
import { VideoLinkItem } from './VideoLinkItem';
import { AddVideoLinkDialog } from './AddVideoLinkDialog';
import { spotService } from 'src/services/spotService';
import { useQueryClient } from '@tanstack/react-query';
import { spotKeys } from 'src/hooks/useSpotQueries';

interface ProPartsTabProps {
    spot: Spot;
    currentUserId?: string;
}

export const ProPartsTab = ({ spot, currentUserId }: ProPartsTabProps) => {
    const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
    const queryClient = useQueryClient();

    const handleSuccess = () => {
        // Invalidate spot query to refresh data
        queryClient.invalidateQueries({ queryKey: spotKeys.details(spot.id) });
    };

    const handleLike = async (id: string, isLiked: boolean) => {
        if (!currentUserId) return;
        
        // Optimistic update could go here, but for simplicity we'll just invalidate
        try {
            await spotService.toggleVideoLinkLike(id, currentUserId, isLiked);
            queryClient.invalidateQueries({ queryKey: spotKeys.details(spot.id) });
        } catch (error) {
            console.error('Failed to toggle like', error);
        }
    };

    const links = spot.videoLinks || [];

    return (
        <Box>
            <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 2 }}>
                <Button
                    variant="outlined"
                    startIcon={<AddIcon />}
                    onClick={() => setIsAddDialogOpen(true)}
                    disabled={!currentUserId}
                    size="small"
                >
                    Add Pro Clip
                </Button>
            </Box>

            {links.length === 0 ? (
                <Box sx={{ py: 4, textAlign: 'center', bgcolor: 'background.paper', borderRadius: 1 }}>
                    <Typography variant="body1" color="text.secondary" gutterBottom>
                        No pro video parts linked yet.
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                        Be the first to add a clip from a skate video!
                    </Typography>
                </Box>
            ) : (
                <Stack spacing={0}>
                    {links.map((link: SpotVideoLink) => (
                        <VideoLinkItem
                            key={link.id}
                            link={link}
                            currentUserId={currentUserId}
                            onLike={handleLike}
                            onDeleteSuccess={handleSuccess}
                            onEditSuccess={handleSuccess}
                        />
                    ))}
                </Stack>
            )}

            {currentUserId && (
                <AddVideoLinkDialog
                    open={isAddDialogOpen}
                    onClose={() => setIsAddDialogOpen(false)}
                    spotId={spot.id}
                    userId={currentUserId}
                    onSuccess={handleSuccess}
                />
            )}
        </Box>
    );
};
