import React, { useState, useRef } from 'react';
import { Box, Button, Typography, IconButton, CircularProgress } from '@mui/material';
import { PhotoCamera as PhotoCameraIcon, Close as CloseIcon } from '@mui/icons-material';

interface ImageUploaderProps {
    initialImageUrl?: string | null;
    onImageUpload: (file: File | null) => void;
    label?: string;
    disabled?: boolean;
    loading?: boolean;
}

export const ImageUploader: React.FC<ImageUploaderProps> = ({
    initialImageUrl,
    onImageUpload,
    label = 'Upload Image',
    disabled = false,
    loading = false,
}) => {
    const [previewUrl, setPreviewUrl] = useState<string | null>(initialImageUrl || null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                setPreviewUrl(reader.result as string);
            };
            reader.readAsDataURL(file);
            onImageUpload(file);
        } else {
            setPreviewUrl(null);
            onImageUpload(null);
        }
    };

    const handleRemoveImage = () => {
        setPreviewUrl(null);
        onImageUpload(null);
        if (fileInputRef.current) {
            fileInputRef.current.value = ''; // Clear the file input
        }
    };

    const handleClick = () => {
        if (fileInputRef.current) {
            fileInputRef.current.click();
        }
    };

    return (
        <Box sx={{ mt: 2, mb: 3 }}>
            <Typography variant="h6" gutterBottom>{label}</Typography>
            <input
                type="file"
                accept="image/*"
                ref={fileInputRef}
                onChange={handleFileChange}
                style={{ display: 'none' }}
                disabled={disabled || loading}
            />
            {previewUrl ? (
                <Box sx={{ position: 'relative', width: 200, height: 150, border: '1px solid #ccc', borderRadius: 2, overflow: 'hidden' }}>
                    <Box
                        component="img"
                        src={previewUrl}
                        alt="Image Preview"
                        sx={{ width: '100%', height: '100%', objectFit: 'cover' }}
                    />
                    <IconButton
                        size="small"
                        onClick={handleRemoveImage}
                        sx={{
                            position: 'absolute',
                            top: 4,
                            right: 4,
                            bgcolor: 'rgba(255,255,255,0.7)',
                            '&:hover': { bgcolor: 'rgba(255,255,255,0.9)' }
                        }}
                        disabled={disabled || loading}
                    >
                        <CloseIcon fontSize="small" />
                    </IconButton>
                </Box>
            ) : (
                <Button
                    variant="outlined"
                    component="span"
                    startIcon={loading ? <CircularProgress size={20} /> : <PhotoCameraIcon />}
                    onClick={handleClick}
                    disabled={disabled || loading}
                    sx={{ mt: 1 }}
                >
                    {label}
                </Button>
            )}
        </Box>
    );
};