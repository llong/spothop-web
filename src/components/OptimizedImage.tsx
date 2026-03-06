import React, { useState, useEffect } from 'react';
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

export const OptimizedImage: React.FC<OptimizedImageProps> = ({
    src,
    alt,
    sx,
    onClick,
    crossOrigin = "anonymous",
    objectFit = 'cover'
}) => {
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(false);

    useEffect(() => {
        setIsLoading(true);
        setError(false);
    }, [src]);

    const handleLoad = () => {
        setIsLoading(false);
    };

    const handleError = () => {
        setIsLoading(false);
        setError(true);
    };

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
                bgcolor: 'grey.100',
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
                    color: 'text.disabled',
                    p: 2,
                    textAlign: 'center'
                }}>
                    <ImageNotSupportedIcon sx={{ fontSize: 40, mb: 1, opacity: 0.5 }} />
                    <Typography variant="caption" sx={{ fontWeight: 500 }}>
                        Image failed to load
                    </Typography>
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
