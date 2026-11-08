import { useState } from 'react';
import { v4 as uuidv4 } from 'uuid';
import type { VideoAsset } from '@/types';
import { captureVideoThumbnail } from '@/utils/videoProcessing';

export function useVideoUpload(onFilesSelect: (videos: VideoAsset[]) => void) {
    const [selectedVideos, setSelectedVideos] = useState<VideoAsset[]>([]);
    const [trimmerOpen, setTrimmerOpen] = useState(false);
    const [pendingFile, setPendingFile] = useState<File | null>(null);
    const [thumbnailSelectorOpen, setThumbnailSelectorOpen] = useState(false);
    const [activeVideoId, setActiveVideoId] = useState<string | null>(null);
    const [previewOpen, setPreviewOpen] = useState(false);
    const [previewVideo, setPreviewVideo] = useState<VideoAsset | null>(null);

    const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
        if (event.target.files && event.target.files.length > 0) {
            const file = event.target.files[0];
            if (!file.type.startsWith('video/')) {
                alert('Please select a valid video file.');
                return;
            }
            setPendingFile(file);
            setTrimmerOpen(true);
            event.target.value = ''; // allow picking the same file again
        }
    };

    const addVideo = (asset: VideoAsset) => {
        const updatedVideos = [...selectedVideos, asset];
        setSelectedVideos(updatedVideos);
        onFilesSelect(updatedVideos);
    };

    /** Adds the trimmed video. Throws (so the trimmer can show it) when no thumbnail frame can be read. */
    const handleTrimmed = async (trimmedBlob: Blob) => {
        if (!pendingFile) return;
        const fileName = pendingFile.name.replace(/\.[^/.]+$/, "") + "_trimmed.mp4";
        const file = new File([trimmedBlob], fileName, { type: 'video/mp4' });

        // Every video needs a thumbnail (the middle frame by default), so a failure here rejects the video
        const thumbnail = await captureVideoThumbnail(file).catch((error) => {
            console.error('Failed to generate thumbnail', error);
            throw new Error("Couldn't read a thumbnail frame from this video. Try another video.");
        });
        addVideo({ id: uuidv4(), file, thumbnail });
        setTrimmerOpen(false);
        setPendingFile(null);
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

    const handleOpenPreview = (asset: VideoAsset) => {
        setPreviewVideo(asset);
        setPreviewOpen(true);
    };

    const handleClosePreview = () => {
        setPreviewOpen(false);
        setPreviewVideo(null);
    };

    return {
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
        handleFileSelect,
        handleTrimmed,
        handleRemove,
        handleOpenThumbnailSelector,
        handleThumbnailSelected,
        handleOpenPreview,
        handleClosePreview
    };
}
