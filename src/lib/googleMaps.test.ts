import { describe, it, expect, beforeEach, vi } from 'vitest';

describe('googleMaps loader', () => {
    beforeEach(() => {
        vi.resetModules();
        delete (window as any).google;
        delete (window as any).__spothopGoogleMapsLoaded;
        document.head.querySelectorAll('script[src*="maps.googleapis.com"]').forEach(s => s.remove());
    });

    it('resolves immediately without injecting a script when already loaded', async () => {
        (window as any).google = { maps: { places: {} } };
        const { loadGoogleMaps, isGoogleMapsReady } = await import('./googleMaps');

        expect(isGoogleMapsReady()).toBe(true);
        await loadGoogleMaps();
        expect(document.head.querySelectorAll('script[src*="maps.googleapis.com"]').length).toBe(0);
    });

    it('injects the script once for concurrent callers and resolves on the callback', async () => {
        const { loadGoogleMaps } = await import('./googleMaps');

        const p1 = loadGoogleMaps();
        const p2 = loadGoogleMaps();
        const scripts = document.head.querySelectorAll('script[src*="maps.googleapis.com"]');
        expect(scripts.length).toBe(1);
        expect(scripts[0].getAttribute('src')).toContain('libraries=places');
        expect(scripts[0].getAttribute('src')).toContain('callback=__spothopGoogleMapsLoaded');

        (window as any).google = { maps: { places: {} } };
        (window as any).__spothopGoogleMapsLoaded();
        await expect(Promise.all([p1, p2])).resolves.toBeDefined();
    });

    it('rejects on script error and allows a retry', async () => {
        const { loadGoogleMaps } = await import('./googleMaps');

        const failed = loadGoogleMaps();
        const script = document.head.querySelector('script[src*="maps.googleapis.com"]') as HTMLScriptElement;
        script.onerror?.(new Event('error'));
        await expect(failed).rejects.toThrow('Failed to load Google Maps');

        loadGoogleMaps();
        expect(document.head.querySelectorAll('script[src*="maps.googleapis.com"]').length).toBe(1);
    });
});
