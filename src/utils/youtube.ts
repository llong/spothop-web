export const parseYoutubeId = (url: string): string | null => {
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
    const match = url.match(regExp);
    return (match && match[2].length === 11) ? match[2] : null;
};

export const timeToSeconds = (time: string): number | null => {
    if (!time) return null;
    // Allow pure seconds input
    if (/^\d+$/.test(time)) return parseInt(time, 10);
    
    const parts = time.split(':').reverse();
    let seconds = 0;
    for (let i = 0; i < parts.length; i++) {
        const val = parseInt(parts[i], 10);
        if (isNaN(val)) return null;
        seconds += val * Math.pow(60, i);
    }
    return seconds;
};

export const secondsToTime = (seconds: number): string => {
    if (seconds === undefined || seconds === null) return '0:00';
    const m = Math.floor(seconds / 60);
    const s = Math.floor(seconds % 60);
    return `${m}:${s.toString().padStart(2, '0')}`;
};
