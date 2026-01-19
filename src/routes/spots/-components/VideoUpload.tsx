import { useState, useRef } from 'react';
import { Button, Box, Typography, IconButton, Card, Stack, Dialog } from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import VideoFileIcon from '@mui/icons-material/VideoFile';
import ImageIcon from '@mui/icons-material/Image';
import { v4 as uuidv4 } from 'uuid';
import type { VideoAsset } from 'src/types';
import { VideoThumbnailSelector } from './VideoThumbnailSelector';
import { VideoTrimmer } from './VideoTrimmer';

interface VideoUploadProps {
    onFilesSelect: (videos: VideoAsset[]) => void;
}

export const VideoUpload = ({ onFilesSelect }: VideoUploadProps) => {
    const [selectedVideos, setSelectedVideos] = useState<VideoAsset[]>([]);
    const [thumbnailSelectorOpen, setThumbnailSelectorOpen] = useState(false);
    const [activeVideoId, setActiveVideoId] = useState<string | null>(null);

    // Trimmer state
    const [trimmerOpen, setTrimmerOpen] = useState(false);
    const [pendingFile, setPendingFile] = useState<File | null>(null);

    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
        if (event.target.files && event.target.files.length > 0) {
            const file = event.target.files[0];

            if (!file.type.startsWith('video/')) {
                alert('Please select a valid video file.');
                return;
            }

            setPendingFile(file);
            setTrimmerOpen(true);

            // Reset input so the same file can be selected again
            if (fileInputRef.current) {
                fileInputRef.current.value = '';
            }
        }
    };

    const handleTrimmed = async (trimmedBlob: Blob) => {
        if (!pendingFile) return;

        const fileName = pendingFile.name.replace(/\.[^/.]+$/, "") + "_trimmed.mp4";
        const trimmedFile = new File([trimmedBlob], fileName, { type: 'video/mp4' });

        try {
            console.log('Generating thumbnail for trimmed video:', fileName);
            const thumbnail = await generateVideoThumbnail(trimmedFile);

            const newAsset: VideoAsset = {
                id: uuidv4(),
                file: trimmedFile,
                thumbnail,
            };

            const updatedVideos = [...selectedVideos, newAsset];
            setSelectedVideos(updatedVideos);
            onFilesSelect(updatedVideos);
        } catch (error) {
            console.error('Failed to generate thumbnail for trimmed video', error);
            const newAsset: VideoAsset = {
                id: uuidv4(),
                file: trimmedFile,
            };
            const updatedVideos = [...selectedVideos, newAsset];
            setSelectedVideos(updatedVideos);
            onFilesSelect(updatedVideos);
        } finally {
            setTrimmerOpen(false);
            setPendingFile(null);
        }
    };

    const generateVideoThumbnail = async (file: File): Promise<File> => {
        return new Promise((resolve, reject) => {
            const video = document.createElement('video');
            const canvas = document.createElement('canvas');
            let hasSeeked = false;

            const handleLoadedMetadata = () => {
                if (video.duration > 0) {
                    video.currentTime = video.duration / 2;
                }
            };

            const handleSeeked = () => {
                if (!hasSeeked && video.videoWidth > 0 && video.videoHeight > 0) {
                    hasSeeked = true;
                    try {
                        canvas.width = video.videoWidth;
                        canvas.height = video.videoHeight;
                        const ctx = canvas.getContext('2d');
                        if (ctx) {
                            ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
                            canvas.toBlob((blob) => {
                                if (blob) {
                                    const fileName = `thumb_${file.name.split('.')[0]}.jpg`;
                                    const thumbnailFile = new File([blob], fileName, { type: 'image/jpeg' });
                                    window.URL.revokeObjectURL(video.src);
                                    resolve(thumbnailFile);
                                } else {
                                    reject(new Error('Failed to generate thumbnail blob'));
                                }
                            }, 'image/jpeg', 0.8);
                        } else {
                            reject(new Error('Failed to get canvas context'));
                        }
                    } catch (error) {
                        reject(error);
                    }
                }
            };

            video.addEventListener('loadedmetadata', handleLoadedMetadata, { once: true });
            video.addEventListener('seeked', handleSeeked);
            video.onerror = () => {
                window.URL.revokeObjectURL(video.src);
                reject(new Error('Failed to load video for thumbnail generation'));
            };
            video.src = URL.createObjectURL(file);

            setTimeout(() => {
                if (!hasSeeked) {
                    if (video.videoWidth > 0 && video.videoHeight > 0) {
                        handleSeeked();
                    } else {
                        window.URL.revokeObjectURL(video.src);
                        reject(new Error('Video loading timeout'));
                    }
                }
            }, 3000);
        });
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
                <Box sx={{ textAlign: 'center' }}>
                    <Typography variant="body1" color="text.secondary">
                        Upload videos (Optional)
                    </Typography>
                    <Typography variant="caption" color="error.main" sx={{ fontWeight: 600 }}>
                        All videos will be trimmed to max 20 seconds and optimized.
                    </Typography>
                </Box>
                <Button
                    variant="contained"
                    component="label"
                >
                    Select Video
                    <input
                        type="file"
                        hidden
                        accept="video/*"
                        onChange={handleFileSelect}
                        ref={fileInputRef}
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
                                        {asset.thumbnail ? 'Thumbnail generated' : 'Generating thumbnail...'}
                                    </Typography>
                                </Box>
                                <Button
                                    size="small"
                                    variant="outlined"
                                    onClick={() => handleOpenThumbnailSelector(asset.id)}
                                    disabled={!asset.thumbnail}
                                >
                                    {asset.thumbnail ? 'Change Thumbnail' : 'Generating...'}
                                </Button>
                            </Box>
                        </Card>
                    ))}
                </Stack>
            )}

            <Dialog
                open={trimmerOpen}
                onClose={() => !pendingFile && setTrimmerOpen(false)}
                maxWidth="sm"
                fullWidth
            >
                {pendingFile && (
                    <VideoTrimmer
                        file={pendingFile}
                        onTrimmed={handleTrimmed}
                        onCancel={() => {
                            setTrimmerOpen(false);
                            setPendingFile(null);
                        }}
                        maxDuration={20}
                    />
                )}
            </Dialog>

            <VideoThumbnailSelector
                open={thumbnailSelectorOpen}
                onClose={() => setThumbnailSelectorOpen(false)}
                videoFile={activeVideo}
                onSelectThumbnail={handleThumbnailSelected}
            />
        </Box>
    );
};
