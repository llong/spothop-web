import { describe, it, expect } from 'vitest';
import { parseYoutubeId, timeToSeconds, secondsToTime } from '../youtube';

describe('youtube utils', () => {
    describe('parseYoutubeId', () => {
        it('parses standard youtube URLs', () => {
            expect(parseYoutubeId('https://www.youtube.com/watch?v=dQw4w9WgXcQ')).toBe('dQw4w9WgXcQ');
            expect(parseYoutubeId('https://youtu.be/dQw4w9WgXcQ')).toBe('dQw4w9WgXcQ');
            expect(parseYoutubeId('https://www.youtube.com/embed/dQw4w9WgXcQ')).toBe('dQw4w9WgXcQ');
        });

        it('returns null for invalid URLs', () => {
            expect(parseYoutubeId('https://google.com')).toBeNull();
            expect(parseYoutubeId('abc')).toBeNull();
        });
    });

    describe('timeToSeconds', () => {
        it('parses mm:ss format', () => {
            expect(timeToSeconds('1:30')).toBe(90);
            expect(timeToSeconds('10:00')).toBe(600);
        });

        it('parses pure seconds', () => {
            expect(timeToSeconds('45')).toBe(45);
        });

        it('returns null for invalid time', () => {
            expect(timeToSeconds('abc')).toBeNull();
        });
    });

    describe('secondsToTime', () => {
        it('formats seconds to mm:ss', () => {
            expect(secondsToTime(90)).toBe('1:30');
            expect(secondsToTime(65)).toBe('1:05');
            expect(secondsToTime(5)).toBe('0:05');
        });
    });
});
