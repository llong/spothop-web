import { useState } from 'react';
import { Box, Tabs, Tab, Typography, Grid, List } from '@mui/material';
import type { Spot, UserMediaItem } from 'src/types';
import { SpotGalleryItem } from './SpotGalleryItem';
import { MediaGalleryItem } from './MediaGalleryItem';
import { LightboxDialog } from './LightboxDialog';
import { useLightbox } from '../hooks/useLightbox';

interface UserContentGalleryProps {
    createdSpots: Spot[];
    uploadedMedia: UserMediaItem[];
    isLoading: boolean;
}

interface TabPanelProps {
    children?: React.ReactNode;
    index: number;
    value: number;
}

function CustomTabPanel(props: TabPanelProps) {
    const { children, value, index, ...other } = props;

    return (
        <div
            role="tabpanel"
            hidden={value !== index}
            id={`simple-tabpanel-${index}`}
            aria-labelledby={`simple-tab-${index}`}
            {...other}
        >
            {value === index && (
                <Box sx={{ py: 3 }}>
                    {children}
                </Box>
            )}
        </div>
    );
}

export const UserContentGallery = ({ createdSpots, uploadedMedia, isLoading }: UserContentGalleryProps) => {
    const [tabValue, setTabValue] = useState(0);
    const {
        lightboxIndex,
        currentMedia,
        openLightbox,
        closeLightbox,
        nextMedia,
        prevMedia
    } = useLightbox(uploadedMedia);

    const handleTabChange = (_event: React.SyntheticEvent, newValue: number) => {
        setTabValue(newValue);
    };

    if (isLoading) {
        return <Typography>Loading content...</Typography>;
    }

    return (
        <Box sx={{ width: '100%' }}>
            <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
                <Tabs value={tabValue} onChange={handleTabChange} aria-label="user content tabs">
                    <Tab label={`Spots (${createdSpots.length})`} id="tab-0" />
                    <Tab label={`Media (${uploadedMedia.length})`} id="tab-1" />
                </Tabs>
            </Box>

            <CustomTabPanel value={tabValue} index={0}>
                {createdSpots.length === 0 ? (
                    <Typography color="text.secondary">No spots created yet.</Typography>
                ) : (
                    <List sx={{ width: '100%', bgcolor: 'background.paper' }}>
                        {createdSpots.map((spot) => (
                            <SpotGalleryItem key={spot.id} spot={spot} />
                        ))}
                    </List>
                )}
            </CustomTabPanel>

            <CustomTabPanel value={tabValue} index={1}>
                {uploadedMedia.length === 0 ? (
                    <Typography color="text.secondary">No media uploaded yet.</Typography>
                ) : (
                    <Grid container spacing={2}>
                        {uploadedMedia.map((item, index) => (
                            <MediaGalleryItem
                                key={item.id}
                                item={item}
                                index={index}
                                onClick={openLightbox}
                            />
                        ))}
                    </Grid>
                )}
            </CustomTabPanel>

            <LightboxDialog
                open={lightboxIndex !== null}
                onClose={closeLightbox}
                currentMedia={currentMedia}
                onNext={nextMedia}
                onPrev={prevMedia}
                hasMultiple={uploadedMedia.length > 1}
            />
        </Box>
    );
};
