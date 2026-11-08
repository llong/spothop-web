import { describe, it, expect, afterEach, vi } from 'vitest';
import { isVideoTrimSupported } from '@/utils/videoProcessing';

describe('videoProcessing utils', () => {
    afterEach(() => vi.unstubAllGlobals());

    describe('isVideoTrimSupported', () => {
        it('is true when WebCodecs encoder and decoder exist', () => {
            vi.stubGlobal('VideoEncoder', class {});
            vi.stubGlobal('VideoDecoder', class {});
            expect(isVideoTrimSupported()).toBe(true);
        });

        it('is false without WebCodecs', () => {
            vi.stubGlobal('VideoEncoder', undefined);
            vi.stubGlobal('VideoDecoder', undefined);
            expect(isVideoTrimSupported()).toBe(false);
        });
    });
});
