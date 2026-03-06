import { useState, useEffect, useRef } from 'react';

export function useYoutubePlayer(linkId: string, startTime: number = 0) {
    const [isPlaying, setIsPlaying] = useState(false);
    const [playerKey, setPlayerKey] = useState(0);
    const playerRef = useRef<any>(null);

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
            // @ts-ignore
            if (window.YT && window.YT.Player) {
                // @ts-ignore
                playerRef.current = new window.YT.Player(`youtube-player-${linkId}`, {
                    events: {
                        'onStateChange': (event: any) => {
                            if (event.data === 0) { // ENDED
                                event.target.seekTo(startTime);
                                event.target.playVideo();
                            }
                        }
                    }
                });
            }
        };

        // @ts-ignore
        if (!window.YT) {
            const tag = document.createElement('script');
            tag.src = "https://www.youtube.com/iframe_api";
            const firstScriptTag = document.getElementsByTagName('script')[0];
            if (firstScriptTag && firstScriptTag.parentNode) {
                firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);
            } else {
                document.head.appendChild(tag);
            }
            // @ts-ignore
            window.onYouTubeIframeAPIReady = initPlayer;
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
