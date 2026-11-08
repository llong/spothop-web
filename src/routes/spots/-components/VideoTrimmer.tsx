import React, { useState, useRef } from 'react';
import { Alert, Box, Slider, Typography, Button, IconButton, LinearProgress, Stack } from '@mui/material';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import PauseIcon from '@mui/icons-material/Pause';
import { useObjectUrl } from '@/hooks/useObjectUrl';
import { trimVideo, isVideoTrimSupported } from '@/utils/videoProcessing';

/** Seconds before the end point to preview, so the end thumb shows the final kept frame. */
const LAST_FRAME_OFFSET = 0.05;

interface VideoTrimmerProps {
    file: File;
    /** May reject (e.g. no thumbnail could be made); the message is shown and the dialog stays open. */
    onTrimmed: (trimmedBlob: Blob) => void | Promise<void>;
    onCancel: () => void;
    maxDuration?: number;
}

export const VideoTrimmer: React.FC<VideoTrimmerProps> = ({
    file,
    onTrimmed,
    onCancel,
    maxDuration = 20
}) => {
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

    const videoUrl = useObjectUrl(file);

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
        videoRef.current?.pause();
        setIsProcessing(true);
        setProgress(0);
        setError(null);
        try {
            await onTrimmed(await trimVideo(file, start, end, setProgress, controller.signal));
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

    const formatTime = (seconds: number) => `${seconds.toFixed(1)}s`;

    return (
        // Fills the dialog on phones (it is full screen there) so the video and slider are big enough to use
        <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 2, p: 2 }}>
            <Typography variant="h6" fontWeight={700}>Trim video</Typography>

            <Box
                sx={{
                    position: 'relative',
                    flex: { xs: 1, sm: 'none' },
                    height: { sm: 420 },
                    minHeight: 240,
                    bgcolor: 'common.black',
                    borderRadius: 2,
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
                            inset: 0,
                            width: '100%',
                            height: '100%',
                            objectFit: 'contain'
                        }}
                    />
                )}
            </Box>

            <Stack spacing={0.5}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <IconButton onClick={togglePlay} color="primary" disabled={!videoUrl} aria-label={isPlaying ? 'pause' : 'play'}>
                        {isPlaying ? <PauseIcon /> : <PlayArrowIcon />}
                    </IconButton>
                    <Typography variant="caption" sx={{ flex: 1 }}>
                        {currentTime.toFixed(1)}s / {duration.toFixed(1)}s
                    </Typography>
                    <Typography variant="body2" color="primary" fontWeight={600}>
                        Selected: {(end - start).toFixed(1)}s (Max {maxDuration}s)
                    </Typography>
                </Box>

                {/* Padding keeps the big touch thumbs from being clipped at the screen edge */}
                <Box sx={{ px: 2 }}>
                    <Slider
                        value={range}
                        onChange={handleRangeChange}
                        min={0}
                        max={duration}
                        step={0.1}
                        valueLabelDisplay="auto"
                        valueLabelFormat={formatTime}
                        disabled={isProcessing || !videoUrl}
                        sx={{ '& .MuiSlider-thumb': { width: 28, height: 28 } }}
                    />
                </Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', px: 2 }}>
                    <Typography variant="caption" color="text.secondary">Start {formatTime(start)}</Typography>
                    <Typography variant="caption" color="text.secondary">End {formatTime(end)}</Typography>
                </Box>
            </Stack>

            {!supported && (
                <Alert severity="warning">This browser can't process video. Try the latest Chrome, Safari or Firefox.</Alert>
            )}
            {error && <Alert severity="error">{error}</Alert>}
            {isProcessing && <LinearProgress variant="determinate" value={progress} />}

            <Box sx={{ display: 'flex', gap: 1.5 }}>
                <Button size="large" onClick={handleCancel}>Cancel</Button>
                <Button
                    size="large"
                    variant="contained"
                    fullWidth
                    onClick={handleProcess}
                    disabled={isProcessing || !supported || end <= start || !videoUrl}
                >
                    {isProcessing ? `Processing ${progress}%` : 'Trim & Save'}
                </Button>
            </Box>
        </Box>
    );
};
