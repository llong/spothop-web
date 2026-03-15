import { describe, it, expect, vi, beforeEach } from 'vitest';
import posthog from 'posthog-js';
import { initPostHog, analytics } from '../posthog';

vi.mock('posthog-js', () => ({
    default: {
        init: vi.fn(),
    }
}));

describe('posthog', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        
        // Mock env vars
        vi.stubEnv('VITE_POSTHOG_KEY', 'test_key');
        vi.stubEnv('VITE_POSTHOG_HOST', 'https://test.host.com');
    });

    it('should initialize posthog with correct config', () => {
        const result = initPostHog();
        
        expect(posthog.init).toHaveBeenCalledWith('test_key', {
            api_host: 'https://test.host.com',
            ui_host: 'https://us.posthog.com',
            person_profiles: 'identified_only',
            capture_pageview: false,
            persistence: 'localStorage+cookie',
            autocapture: false,
        });
        
        expect(result).toBe(posthog);
    });

    it('should use fallback host if VITE_POSTHOG_HOST is not set', () => {
        vi.stubEnv('VITE_POSTHOG_HOST', '');
        
        initPostHog();
        
        expect(posthog.init).toHaveBeenCalledWith('test_key', expect.objectContaining({
            api_host: 'https://us.i.posthog.com'
        }));
    });

    it('should export analytics as posthog instance', () => {
        expect(analytics).toBe(posthog);
    });
});
