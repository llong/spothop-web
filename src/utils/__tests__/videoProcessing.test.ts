import { describe, it, expect, vi, beforeEach } from 'vitest';
import { checkFFmpegCapabilities } from '../videoProcessing';

describe('videoProcessing utils', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        // Reset global properties
        Object.defineProperty(window, 'SharedArrayBuffer', {
            value: undefined,
            writable: true,
            configurable: true
        });
        Object.defineProperty(window, 'crossOriginIsolated', {
            value: false,
            writable: true,
            configurable: true
        });
    });

    describe('checkFFmpegCapabilities', () => {
        it('returns false when requirements are not met', () => {
            const caps = checkFFmpegCapabilities();
            expect(caps.multiThreadingSupported).toBe(false);
        });

        it('returns true when SharedArrayBuffer and crossOriginIsolated are available', () => {
            Object.defineProperty(window, 'SharedArrayBuffer', { value: class {} });
            Object.defineProperty(window, 'crossOriginIsolated', { value: true });
            
            const caps = checkFFmpegCapabilities();
            expect(caps.multiThreadingSupported).toBe(true);
        });
    });
});
