import { useState } from 'react';
import { Button, Box, Typography, IconButton, Card, Stack } from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import VideoFileIcon from '@mui/icons-material/VideoFile';
import ImageIcon from '@mui/icons-material/Image';
import { v4 as uuidv4 } from 'uuid';
import type { VideoAsset } from 'src/types';
import { VideoThumbnailSelector } from './VideoThumbnailSelector';

interface VideoUploadProps {
    onFilesSelect: (videos: VideoAsset[]) => void;
}

export const VideoUpload = ({ onFilesSelect }: VideoUploadProps) => {
    const [selectedVideos, setSelectedVideos] = useState<VideoAsset[]>([]);
    const [thumbnailSelectorOpen, setThumbnailSelectorOpen] = useState(false);
    const [activeVideoId, setActiveVideoId] = useState<string | null>(null);

    const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
        if (event.target.files && event.target.files.length > 0) {
            const newFiles = Array.from(event.target.files);

            // Validate file types
            const validFiles = newFiles.filter(file => file.type.startsWith('video/'));

            if (validFiles.length !== newFiles.length) {
                alert('Some files were skipped because they are not valid video files.');
            }

            const newAssets: VideoAsset[] = validFiles.map(file => ({
                id: uuidv4(),
                file,
            }));

            const updatedVideos = [...selectedVideos, ...newAssets];
            setSelectedVideos(updatedVideos);
            onFilesSelect(updatedVideos);
        }
    };

    const handleRemove = (id: string) => {
        const updatedVideos = selectedVideos.filter(v => v.id !== id);
        setSelectedVideos(updatedVideos);
        onFilesSelect(updatedVideos);
    };

    const handleOpenThumbnailSelector = (id: string) => {
        setActiveVideoId(id);
        setThumbnailSelectorOpen(true);
    };

    const handleThumbnailSelected = (thumbnail: File) => {
        if (activeVideoId) {
            const updatedVideos = selectedVideos.map(v =>
                v.id === activeVideoId ? { ...v, thumbnail } : v
            );
            setSelectedVideos(updatedVideos);
            onFilesSelect(updatedVideos);
        }
    };

    const activeVideo = selectedVideos.find(v => v.id === activeVideoId)?.file || null;

    return (
        <Box sx={{ width: '100%' }}>
            <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2, p: 3, border: '2px dashed #ccc', borderRadius: 2, bgcolor: 'grey.50' }}>
                <VideoFileIcon sx={{ fontSize: 48, color: 'text.secondary' }} />
                <Typography variant="body1" color="text.secondary">
                    Upload videos (Optional)
                </Typography>
                <Button
                    variant="contained"
                    component="label"
                >
                    Select Videos
                    <input
                        type="file"
                        hidden
                        accept="video/*"
                        multiple
                        onChange={handleFileSelect}
                    />
                </Button>
            </Box>

            {selectedVideos.length > 0 && (
                <Stack spacing={2} sx={{ mt: 2 }}>
                    {selectedVideos.map((asset) => (
                        <Card key={asset.id} sx={{ p: 2 }}>
                            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, overflow: 'hidden' }}>
                                    <VideoFileIcon color="primary" />
                                    <Typography noWrap sx={{ maxWidth: 200 }}>{asset.file.name}</Typography>
                                </Box>
                                <IconButton onClick={() => handleRemove(asset.id)} color="error">
                                    <DeleteIcon />
                                </IconButton>
                            </Box>

                            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                    {asset.thumbnail ? (
                                        <Box
                                            component="img"
                                            src={URL.createObjectURL(asset.thumbnail)}
                                            sx={{ width: 40, height: 40, objectFit: 'cover', borderRadius: 1 }}
                                        />
                                    ) : (
                                        <Box sx={{ width: 40, height: 40, bgcolor: 'grey.200', borderRadius: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                            <ImageIcon fontSize="small" color="disabled" />
                                        </Box>
                                    )}
                                    <Typography variant="caption" color="text.secondary">
                                        {asset.thumbnail ? 'Thumbnail set' : 'No thumbnail'}
                                    </Typography>
                                </Box>
                                <Button
                                    size="small"
                                    variant="outlined"
                                    onClick={() => handleOpenThumbnailSelector(asset.id)}
                                >
                                    {asset.thumbnail ? 'Change Thumbnail' : 'Set Thumbnail'}
                                </Button>
                            </Box>
                        </Card>
                    ))}
                </Stack>
            )}

            <VideoThumbnailSelector
                open={thumbnailSelectorOpen}
                onClose={() => setThumbnailSelectorOpen(false)}
                videoFile={activeVideo}
                onSelectThumbnail={handleThumbnailSelected}
            />
        </Box>
    );
};
