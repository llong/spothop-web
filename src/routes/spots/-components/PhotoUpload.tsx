import { useState, useEffect } from 'react';
import { Button, Box, Typography, Card, CardMedia, IconButton, Grid } from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import AddPhotoAlternateIcon from '@mui/icons-material/AddPhotoAlternate';

interface PhotoUploadProps {
    onFilesSelect: (files: File[]) => void;
}

export const PhotoUpload = ({ onFilesSelect }: PhotoUploadProps) => {
    const [previewUrls, setPreviewUrls] = useState<string[]>([]);
    const [selectedFiles, setSelectedFiles] = useState<File[]>([]);

    const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
        if (event.target.files && event.target.files.length > 0) {
            const newFiles = Array.from(event.target.files);

            // Validate file types
            const validFiles = newFiles.filter(file => file.type.startsWith('image/'));

            if (validFiles.length !== newFiles.length) {
                alert('Some files were skipped because they are not valid images.');
            }

            const updatedFiles = [...selectedFiles, ...validFiles];
            setSelectedFiles(updatedFiles);
            onFilesSelect(updatedFiles);

            // Create preview URLs
            const newPreviewUrls = validFiles.map(file => URL.createObjectURL(file));
            setPreviewUrls(prev => [...prev, ...newPreviewUrls]);
        }
    };

    const handleRemove = (index: number) => {
        URL.revokeObjectURL(previewUrls[index]);

        const newPreviewUrls = previewUrls.filter((_, i) => i !== index);
        setPreviewUrls(newPreviewUrls);

        const newFiles = selectedFiles.filter((_, i) => i !== index);
        setSelectedFiles(newFiles);
        onFilesSelect(newFiles);
    };

    // Cleanup object URLs on unmount
    useEffect(() => {
        return () => {
            previewUrls.forEach(url => URL.revokeObjectURL(url));
        };
    }, []);

    return (
        <Box sx={{ width: '100%' }}>
            <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2, p: 3, border: '2px dashed #ccc', borderRadius: 2, bgcolor: 'grey.50' }}>
                <AddPhotoAlternateIcon sx={{ fontSize: 48, color: 'text.secondary' }} />
                <Typography variant="body1" color="text.secondary">
                    Upload photos of the spot (Required)
                </Typography>
                <Button
                    variant="contained"
                    component="label"
                >
                    Select Photos
                    <input
                        type="file"
                        hidden
                        accept="image/*"
                        multiple
                        onChange={handleFileSelect}
                    />
                </Button>
            </Box>

            {previewUrls.length > 0 && (
                <Grid container spacing={2} sx={{ mt: 2 }}>
                    {previewUrls.map((url, index) => (
                        <Grid size={{ xs: 6, sm: 4 }} key={url}>
                            <Card sx={{ position: 'relative' }}>
                                <CardMedia
                                    component="img"
                                    image={url}
                                    alt={`Spot preview ${index + 1}`}
                                    sx={{ height: 150, objectFit: 'cover' }}
                                />
                                <IconButton
                                    aria-label="remove photo"
                                    onClick={() => handleRemove(index)}
                                    sx={{
                                        position: 'absolute',
                                        top: 4,
                                        right: 4,
                                        bgcolor: 'rgba(0, 0, 0, 0.6)',
                                        color: 'white',
                                        '&:hover': { bgcolor: 'rgba(0, 0, 0, 0.8)' },
                                        padding: '4px'
                                    }}
                                    size="small"
                                >
                                    <DeleteIcon fontSize="small" />
                                </IconButton>
                            </Card>
                        </Grid>
                    ))}
                </Grid>
            )}
        </Box>
    );
};
