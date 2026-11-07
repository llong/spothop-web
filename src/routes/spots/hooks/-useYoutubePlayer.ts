import { useState, useEffect, useRef } from 'react';

interface YouTubePlayerEvent {
    data: number;
    target: { seekTo: (seconds: number) => void; playVideo: () => void };
}

interface YouTubeApiWindow extends Window {
    YT?: {
        Player: new (
            elementId: string,
            options: { events: { onStateChange: (event: YouTubePlayerEvent) => void } }
        ) => unknown;
    };
    onYouTubeIframeAPIReady?: () => void;
}

export function useYoutubePlayer(linkId: string, startTime: number = 0) {
    const [isPlaying, setIsPlaying] = useState(false);
    const [playerKey, setPlayerKey] = useState(0);
    const playerRef = useRef<unknown>(null);

    const handlePlay = () => setIsPlaying(true);
    const handleClose = () => {
        setIsPlaying(false);
        playerRef.current = null;
    };

    const handleReplay = () => {
        setPlayerKey(prev => prev + 1);
    };

    useEffect(() => {
        if (!isPlaying) return;

        const initPlayer = () => {
            const yt = (window as YouTubeApiWindow).YT;
            if (yt && yt.Player) {
                playerRef.current = new yt.Player(`youtube-player-${linkId}`, {
                    events: {
                        'onStateChange': (event: YouTubePlayerEvent) => {
                            if (event.data === 0) { // ENDED
                                event.target.seekTo(startTime);
                                event.target.playVideo();
                            }
                        }
                    }
                });
            }
        };

        if (!(window as YouTubeApiWindow).YT) {
            const tag = document.createElement('script');
            tag.src = "https://www.youtube.com/iframe_api";
            const firstScriptTag = document.getElementsByTagName('script')[0];
            if (firstScriptTag && firstScriptTag.parentNode) {
                firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);
            } else {
                document.head.appendChild(tag);
            }
            (window as YouTubeApiWindow).onYouTubeIframeAPIReady = initPlayer;
        } else {
            initPlayer();
        }

        return () => {
            playerRef.current = null;
        };
    }, [isPlaying, linkId, startTime, playerKey]);

    return {
        isPlaying,
        playerKey,
        handlePlay,
        handleClose,
        handleReplay
    };
}
