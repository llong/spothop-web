import React, { useState, useRef, useEffect } from 'react';
import { Alert, Box, Slider, Typography, Button, CircularProgress, IconButton, Stack } from '@mui/material';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import PauseIcon from '@mui/icons-material/Pause';
import { trimVideo, isVideoTrimSupported } from '@/utils/videoProcessing';

/** Seconds before the end point to preview, so the end thumb shows the final kept frame. */
const LAST_FRAME_OFFSET = 0.05;

interface VideoTrimmerProps {
    file: File;
    onTrimmed: (trimmedBlob: Blob) => void;
    onCancel: () => void;
    maxDuration?: number;
}

export const VideoTrimmer: React.FC<VideoTrimmerProps> = ({
    file,
    onTrimmed,
    onCancel,
    maxDuration = 20
}) => {
    const [videoUrl, setVideoUrl] = useState<string | null>(null);
    const [duration, setDuration] = useState(0);
    const [range, setRange] = useState<[number, number]>([0, 0]);
    const [currentTime, setCurrentTime] = useState(0);
    const [isPlaying, setIsPlaying] = useState(false);
    const [isProcessing, setIsProcessing] = useState(false);
    const [progress, setProgress] = useState(0);
    const [error, setError] = useState<string | null>(null);
    const abortControllerRef = useRef<AbortController | null>(null);
    const videoRef = useRef<HTMLVideoElement>(null);

    const supported = isVideoTrimSupported();
    const [start, end] = range;

    useEffect(() => {
        const url = URL.createObjectURL(file);
        setVideoUrl(url);
        return () => URL.revokeObjectURL(url);
    }, [file]);

    const handleLoadedMetadata = () => {
        const d = videoRef.current?.duration ?? 0;
        setDuration(d);
        setRange([0, Math.min(d, maxDuration)]);
    };

    const handleTimeUpdate = () => {
        const video = videoRef.current;
        if (!video) return;
        setCurrentTime(video.currentTime);
        // Loop within the range. Only while playing, otherwise scrubbing to the end point would snap back.
        if (!video.paused && video.currentTime >= end) video.currentTime = start;
    };

    const handleRangeChange = (_event: Event, newValue: number | number[], activeThumb: number) => {
        let [newStart, newEnd] = newValue as [number, number];

        // Stop the dragged thumb at the max length instead of ignoring the move
        if (newEnd - newStart > maxDuration) {
            if (activeThumb === 0) newStart = newEnd - maxDuration;
            else newEnd = newStart + maxDuration;
        }
        setRange([newStart, newEnd]);

        // Scrub: show the frame under the dragged thumb (for the end thumb, the last frame that is kept)
        const video = videoRef.current;
        if (!video) return;
        video.pause();
        video.currentTime = activeThumb === 0 ? newStart : Math.max(newStart, newEnd - LAST_FRAME_OFFSET);
    };

    const togglePlay = () => {
        const video = videoRef.current;
        if (!video) return;
        if (!video.paused) return video.pause();
        if (video.currentTime < start || video.currentTime >= end) video.currentTime = start;
        void video.play();
    };

    const handleProcess = async () => {
        const controller = new AbortController();
        abortControllerRef.current = controller;
        setIsProcessing(true);
        setProgress(0);
        setError(null);
        try {
            onTrimmed(await trimVideo(file, start, end, setProgress, controller.signal));
        } catch (err) {
            if (controller.signal.aborted) return; // the user cancelled
            console.error('Trimming failed:', err);
            setError(err instanceof Error ? err.message : 'Video processing failed.');
        } finally {
            abortControllerRef.current = null;
            setIsProcessing(false);
        }
    };

    const handleCancel = () => {
        abortControllerRef.current?.abort();
        onCancel();
    };

    return (
        <Box sx={{ width: '100%', p: 2 }}>
            <Box
                sx={{
                    position: 'relative',
                    width: '100%',
                    pt: '56.25%',
                    bgcolor: 'black',
                    borderRadius: 1,
                    overflow: 'hidden',
                    cursor: videoUrl ? 'pointer' : 'default'
                }}
                onClick={videoUrl ? togglePlay : undefined}
            >
                {videoUrl && (
                    <video
                        ref={videoRef}
                        src={videoUrl}
                        onLoadedMetadata={handleLoadedMetadata}
                        onTimeUpdate={handleTimeUpdate}
                        onPlay={() => setIsPlaying(true)}
                        onPause={() => setIsPlaying(false)}
                        playsInline
                        style={{
                            position: 'absolute',
                            top: 0,
                            left: 0,
                            width: '100%',
                            height: '100%',
                            objectFit: 'contain'
                        }}
                    />
                )}
            </Box>

            <Stack spacing={2} sx={{ mt: 2 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <IconButton onClick={togglePlay} color="primary" disabled={!videoUrl}>
                        {isPlaying ? <PauseIcon /> : <PlayArrowIcon />}
                    </IconButton>
                    <Typography variant="caption" sx={{ minWidth: 100 }}>
                        {currentTime.toFixed(1)}s / {duration.toFixed(1)}s
                    </Typography>
                    <Typography variant="caption" color="primary">
                        Selected: {(end - start).toFixed(1)}s (Max {maxDuration}s)
                    </Typography>
                </Box>

                <Slider
                    value={range}
                    onChange={handleRangeChange}
                    min={0}
                    max={duration}
                    step={0.1}
                    valueLabelDisplay="auto"
                    disabled={isProcessing || !videoUrl}
                />

                {!supported && (
                    <Alert severity="warning">
                        This browser can't process video. Try the latest Chrome, Safari or Firefox.
                    </Alert>
                )}
                {error && <Alert severity="error">{error}</Alert>}

                <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 2 }}>
                    <Button onClick={handleCancel}>Cancel</Button>
                    <Button
                        variant="contained"
                        onClick={handleProcess}
                        disabled={isProcessing || !supported || end <= start || !videoUrl}
                        startIcon={isProcessing ? <CircularProgress size={20} color="inherit" /> : null}
                    >
                        {isProcessing ? `Processing ${progress}%` : 'Trim & Save'}
                    </Button>
                </Box>
            </Stack>
        </Box>
    );
};
