import React, { useState } from 'react';
import { Box, Skeleton, Typography, type SxProps, type Theme } from '@mui/material';
import ImageNotSupportedIcon from '@mui/icons-material/ImageNotSupported';

interface OptimizedImageProps {
    src: string;
    alt: string;
    sx?: SxProps<Theme>;
    onClick?: () => void;
    crossOrigin?: "anonymous" | "use-credentials" | "";
    objectFit?: 'cover' | 'contain' | 'fill' | 'none' | 'scale-down';
}

// Global cache to track images that have already loaded to prevent skeleton flash on remount
const loadedImageUrls = new Set<string>();

export const OptimizedImage: React.FC<OptimizedImageProps> = ({
    src,
    alt,
    sx,
    onClick,
    crossOrigin,
    objectFit = 'cover'
}) => {
    // Initialize loading to false if we've already loaded this image successfully in this session
    const [isLoading, setIsLoading] = useState(() => !loadedImageUrls.has(src));
    const [error, setError] = useState(false);

    // Track original src for potential retry
    const [currentSrc, setCurrentSrc] = useState(src);

    // Sync src during render (not via useEffect) to avoid an extra render cycle
    // that causes a visible flash of the skeleton
    if (src !== currentSrc) {
        setCurrentSrc(src);
        setIsLoading(!loadedImageUrls.has(src));
        setError(false);
    }

    const handleLoad = () => {
        loadedImageUrls.add(currentSrc);
        setIsLoading(false);
    };

    const handleError = () => {
        console.error(`OptimizedImage failed to load: ${currentSrc}`);
        setIsLoading(false);
        setError(true);
    };

    if (!src) {
        return (
            <Box
                sx={{
                    width: '100%',
                    height: '100%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    bgcolor: 'grey.100',
                    ...sx
                }}
            >
                <ImageNotSupportedIcon sx={{ fontSize: 24, opacity: 0.3 }} />
            </Box>
        );
    }

    return (
        <Box
            sx={{
                position: 'relative',
                width: '100%',
                height: '100%',
                overflow: 'hidden',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                bgcolor: 'transparent',
                ...sx
            }}
            onClick={onClick}
        >
            {isLoading && (
                <Skeleton
                    variant="rectangular"
                    width="100%"
                    height="100%"
                    animation="wave"
                    sx={{ position: 'absolute', top: 0, left: 0 }}
                />
            )}

            {error ? (
                <Box sx={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: 'text.disabled',
                    p: 1,
                    textAlign: 'center',
                    width: '100%',
                    height: '100%'
                }}>
                    <ImageNotSupportedIcon sx={{ fontSize: sx && (sx as any).width < 50 ? 20 : 40, mb: 0.5, opacity: 0.5 }} />
                    {(sx && (sx as any).width >= 100) && (
                        <Typography variant="caption" sx={{ fontWeight: 500, fontSize: '0.7rem' }}>
                            Failed to load
                        </Typography>
                    )}
                </Box>
            ) : (
                <Box
                    component="img"
                    src={src}
                    alt={alt}
                    crossOrigin={crossOrigin}
                    onLoad={handleLoad}
                    onError={handleError}
                    sx={{
                        width: '100%',
                        height: '100%',
                        objectFit: objectFit,
                        opacity: isLoading ? 0 : 1,
                        transition: 'opacity 0.3s ease-in-out',
                    }}
                />
            )}
        </Box>
    );
};
