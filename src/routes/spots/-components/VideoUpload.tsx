import { useState } from 'react';
import { Button, Box, CircularProgress, Typography } from '@mui/material';
import supabase from 'src/supabase';

interface VideoUploadProps {
    onUpload: (url: string) => void;
    spotId: string | null;
}

export const VideoUpload = ({ onUpload, spotId }: VideoUploadProps) => {
    const [uploading, setUploading] = useState(false);

    const handleUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
        try {
            setUploading(true);
            if (!event.target.files || event.target.files.length === 0) {
                throw new Error('You must select a video to upload.');
            }

            const file = event.target.files[0];
            const fileExt = file.name.split('.').pop();
            const fileName = `${Math.random()}.${fileExt}`;
            const filePath = `${spotId}/videos/originals/${fileName}`;

            const { error: uploadError } = await supabase.storage.from('spot-media').upload(filePath, file);

            if (uploadError) {
                throw uploadError;
            }

            const { data: { publicUrl } } = supabase.storage.from('spot-media').getPublicUrl(filePath);
            onUpload(publicUrl);
        } catch (error) {
            if (error instanceof Error) {
                alert(error.message);
            }
        } finally {
            setUploading(false);
        }
    };

    return (
        <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
            <Typography variant="h6">Upload Video</Typography>
            <Button
                variant="contained"
                component="label"
                disabled={uploading || !spotId}
            >
                {uploading ? <CircularProgress size={24} /> : 'Select Video'}
                <input
                    type="file"
                    hidden
                    accept="video/*"
                    onChange={handleUpload}
                    disabled={uploading || !spotId}
                />
            </Button>
            {!spotId && <Typography variant="caption">You must create the spot before uploading a video.</Typography>}
        </Box>
    );
};
