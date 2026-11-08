import { Button, Box, Typography, Stack, Dialog } from '@mui/material';
import VideoFileIcon from '@mui/icons-material/VideoFile';
import type { VideoAsset } from '@/types';
import { VideoThumbnailSelector } from './VideoThumbnailSelector';
import { VideoTrimmer } from './VideoTrimmer';
import { VideoAssetCard } from './VideoAssetCard';
import { VideoPreviewDialog } from './VideoPreviewDialog';
import { useVideoUpload } from '@/routes/spots/hooks/-useVideoUpload';

interface VideoUploadProps {
    onFilesSelect: (videos: VideoAsset[]) => void;
}

export const VideoUpload = ({ onFilesSelect }: VideoUploadProps) => {
    const {
        selectedVideos,
        trimmerOpen,
        setTrimmerOpen,
        pendingFile,
        setPendingFile,
        thumbnailSelectorOpen,
        setThumbnailSelectorOpen,
        activeVideoId,
        previewOpen,
        previewVideo,
        fileInputRef,
        handleFileSelect,
        handleTrimmed,
        handleRemove,
        handleOpenThumbnailSelector,
        handleThumbnailSelected,
        handleOpenPreview,
        handleClosePreview
    } = useVideoUpload(onFilesSelect);

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
                        <VideoAssetCard
                            key={asset.id}
                            asset={asset}
                            onPreview={handleOpenPreview}
                            onChangeThumbnail={handleOpenThumbnailSelector}
                            onRemove={handleRemove}
                        />
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

            <VideoPreviewDialog
                open={previewOpen}
                onClose={handleClosePreview}
                asset={previewVideo}
            />
        </Box>
    );
};
