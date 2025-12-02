import { useState } from 'react';
import { Button, Box, CircularProgress, Typography } from '@mui/material';
import supabase from 'src/supabase';
import { optimizePhoto, generateImageFilename } from 'src/utils/imageOptimization';

interface PhotoUploadProps {
    onUpload: (urls: { original: string; thumbnailSmall: string; thumbnailLarge: string }) => void;
    spotId: string | null;
}

export const PhotoUpload = ({ onUpload, spotId }: PhotoUploadProps) => {
    const [uploading, setUploading] = useState(false);
    const [uploadProgress, setUploadProgress] = useState<string>('');

    const handleUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
        try {
            setUploading(true);
            setUploadProgress('Processing image...');

            if (!event.target.files || event.target.files.length === 0) {
                throw new Error('You must select a photo to upload.');
            }

            if (!spotId) {
                throw new Error('Spot ID is required for upload.');
            }

            const file = event.target.files[0];

            // Validate file type
            if (!file.type.startsWith('image/')) {
                throw new Error('Please select a valid image file.');
            }

            // Optimize the photo (creates original + 2 thumbnails)
            setUploadProgress('Optimizing image...');
            const { original, thumbnailSmall, thumbnailLarge } = await optimizePhoto(file);

            // Generate filenames
            const filename = generateImageFilename();

            // Define storage paths following mobile app structure:
            // {spotId}/photos/originals/{filename}
            // {spotId}/photos/thumbnails/small/{filename}
            // {spotId}/photos/thumbnails/large/{filename}
            const originalPath = `${spotId}/photos/originals/${filename}`;
            const thumbnailSmallPath = `${spotId}/photos/thumbnails/small/${filename}`;
            const thumbnailLargePath = `${spotId}/photos/thumbnails/large/${filename}`;

            // Upload original
            setUploadProgress('Uploading full-size image...');
            const { error: originalError } = await supabase.storage
                .from('spot-media')
                .upload(originalPath, original.blob, {
                    contentType: 'image/jpeg',
                    cacheControl: '3600',
                    upsert: false,
                });

            if (originalError) {
                throw originalError;
            }

            // Upload small thumbnail
            setUploadProgress('Uploading small thumbnail...');
            const { error: smallError } = await supabase.storage
                .from('spot-media')
                .upload(thumbnailSmallPath, thumbnailSmall.blob, {
                    contentType: 'image/jpeg',
                    cacheControl: '3600',
                    upsert: false,
                });

            if (smallError) {
                throw smallError;
            }

            // Upload large thumbnail
            setUploadProgress('Uploading large thumbnail...');
            const { error: largeError } = await supabase.storage
                .from('spot-media')
                .upload(thumbnailLargePath, thumbnailLarge.blob, {
                    contentType: 'image/jpeg',
                    cacheControl: '3600',
                    upsert: false,
                });

            if (largeError) {
                throw largeError;
            }

            // Get public URLs
            const { data: { publicUrl: originalUrl } } = supabase.storage
                .from('spot-media')
                .getPublicUrl(originalPath);

            const { data: { publicUrl: thumbnailSmallUrl } } = supabase.storage
                .from('spot-media')
                .getPublicUrl(thumbnailSmallPath);

            const { data: { publicUrl: thumbnailLargeUrl } } = supabase.storage
                .from('spot-media')
                .getPublicUrl(thumbnailLargePath);

            setUploadProgress('Upload complete!');
            onUpload({
                original: originalUrl,
                thumbnailSmall: thumbnailSmallUrl,
                thumbnailLarge: thumbnailLargeUrl,
            });

        } catch (error) {
            if (error instanceof Error) {
                alert(error.message);
            }
        } finally {
            setUploading(false);
            setUploadProgress('');
        }
    };

    return (
        <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
            <Typography variant="h6">Upload Photo (Required)</Typography>
            {uploadProgress && (
                <Typography variant="body2" color="text.secondary">
                    {uploadProgress}
                </Typography>
            )}
            <Button
                variant="contained"
                component="label"
                disabled={uploading || !spotId}
            >
                {uploading ? <CircularProgress size={24} /> : 'Select Photo'}
                <input
                    type="file"
                    hidden
                    accept="image/*"
                    onChange={handleUpload}
                    disabled={uploading || !spotId}
                />
            </Button>
        </Box>
    );
};

