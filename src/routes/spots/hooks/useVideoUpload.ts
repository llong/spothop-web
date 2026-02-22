import { useState, useRef } from 'react';
import { v4 as uuidv4 } from 'uuid';
import type { VideoAsset } from 'src/types';

export function useVideoUpload(onFilesSelect: (videos: VideoAsset[]) => void) {
    const [selectedVideos, setSelectedVideos] = useState<VideoAsset[]>([]);
    const [trimmerOpen, setTrimmerOpen] = useState(false);
    const [pendingFile, setPendingFile] = useState<File | null>(null);
    const [thumbnailSelectorOpen, setThumbnailSelectorOpen] = useState(false);
    const [activeVideoId, setActiveVideoId] = useState<string | null>(null);
    const [previewOpen, setPreviewOpen] = useState(false);
    const [previewVideo, setPreviewVideo] = useState<VideoAsset | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
        if (event.target.files && event.target.files.length > 0) {
            const file = event.target.files[0];
            if (!file.type.startsWith('video/')) {
                alert('Please select a valid video file.');
                return;
            }
            setPendingFile(file);
            setTrimmerOpen(true);
            if (fileInputRef.current) {
                fileInputRef.current.value = '';
            }
        }
    };

    const handleTrimmed = async (trimmedBlob: Blob, generateThumbnail: (file: File) => Promise<File>) => {
        if (!pendingFile) return;
        const fileName = pendingFile.name.replace(/\.[^/.]+$/, "") + "_trimmed.mp4";
        const trimmedFile = new File([trimmedBlob], fileName, { type: 'video/mp4' });

        try {
            const thumbnail = await generateThumbnail(trimmedFile);
            const newAsset: VideoAsset = { id: uuidv4(), file: trimmedFile, thumbnail };
            const updatedVideos = [...selectedVideos, newAsset];
            setSelectedVideos(updatedVideos);
            onFilesSelect(updatedVideos);
        } catch (error) {
            console.error('Failed to generate thumbnail', error);
            const newAsset: VideoAsset = { id: uuidv4(), file: trimmedFile };
            const updatedVideos = [...selectedVideos, newAsset];
            setSelectedVideos(updatedVideos);
            onFilesSelect(updatedVideos);
        } finally {
            setTrimmerOpen(false);
            setPendingFile(null);
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
        fileInputRef,
        handleFileSelect,
        handleTrimmed,
        handleRemove,
        handleOpenThumbnailSelector,
        handleThumbnailSelected,
        handleOpenPreview,
        handleClosePreview
    };
}
