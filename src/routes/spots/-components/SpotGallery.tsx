import { Box, useMediaQuery, useTheme, Typography } from '@mui/material';

interface SpotGalleryProps {
    photos: string[];
    videoUrl?: string;
}

export const SpotGallery = ({ photos, videoUrl }: SpotGalleryProps) => {
    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

    // If no photos, show a placeholder or return null
    if (!photos || photos.length === 0) {
        return (
            <Box
                sx={{
                    height: 300,
                    bgcolor: 'grey.200',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    borderRadius: 2
                }}
            >
                <Typography color="text.secondary">No photos available</Typography>
            </Box>
        );
    }

    // Main featured image is the first one
    const featuredImage = photos[0];
    const secondaryImages = photos.slice(1, 5); // Show max 4 more images

    return (
        <Box sx={{ height: { xs: 300, md: 450 }, mb: 3, display: 'flex', gap: 1 }}>
            {/* Main Image */}
            <Box
                sx={{
                    flex: { xs: 1, md: 2 },
                    borderRadius: 2,
                    overflow: 'hidden',
                    position: 'relative'
                }}
            >
                <img
                    src={featuredImage}
                    alt="Spot main view"
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                />
                {videoUrl && (
                    <Box
                        sx={{
                            position: 'absolute',
                            top: 16,
                            left: 16,
                            bgcolor: 'primary.main',
                            color: 'white',
                            px: 1.5,
                            py: 0.5,
                            borderRadius: 4,
                            fontSize: '0.75rem',
                            fontWeight: 600
                        }}
                    >
                        Video Available
                    </Box>
                )}
            </Box>

            {/* Secondary Images Grid - only on non-mobile if available */}
            {!isMobile && secondaryImages.length > 0 && (
                <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 1 }}>
                    {secondaryImages.map((img, index) => {
                        const remainingCount = photos.length - 5;

                        // We only show up to 2 secondary images in this column layout for simplicity/height matching
                        // adapting the previous layout logic but cleaner
                        if (index > 1) return null;

                        return (
                            <Box
                                key={index}
                                sx={{
                                    flex: 1,
                                    borderRadius: 2,
                                    overflow: 'hidden',
                                    position: 'relative'
                                }}
                            >
                                <img
                                    src={img}
                                    alt={`Spot view ${index + 2}`}
                                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                                />
                                {index === 1 && remainingCount > 0 && (
                                    <Box
                                        sx={{
                                            position: 'absolute',
                                            inset: 0,
                                            bgcolor: 'rgba(0,0,0,0.5)',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center'
                                        }}
                                    >
                                        <Typography variant="h6" color="white" fontWeight={600}>
                                            +{remainingCount} more
                                        </Typography>
                                    </Box>
                                )}
                            </Box>
                        )
                    })}
                </Box>
            )}
        </Box>
    );
};
