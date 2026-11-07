/**
 * On-demand loader for the Google Maps JS API (Places library).
 *
 * The script is only needed for the Places Autocomplete widget, so it is loaded the first time a
 * search input is used instead of on every page load. This avoids a ~hundreds-of-KB script on every
 * route and the billable Maps JS load for visitors who never search.
 */

const CALLBACK_NAME = '__spothopGoogleMapsLoaded';

let loadPromise: Promise<void> | null = null;

export const isGoogleMapsReady = (): boolean =>
    typeof window !== 'undefined' && !!window.google?.maps?.places;

export function loadGoogleMaps(): Promise<void> {
    if (isGoogleMapsReady()) return Promise.resolve();
    if (loadPromise) return loadPromise;

    loadPromise = new Promise<void>((resolve, reject) => {
        const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;
        const win = window as unknown as Record<string, unknown>;

        win[CALLBACK_NAME] = () => {
            delete win[CALLBACK_NAME];
            resolve();
        };

        const script = document.createElement('script');
        script.src =
            `https://maps.googleapis.com/maps/api/js?key=${encodeURIComponent(apiKey ?? '')}` +
            `&libraries=places&callback=${CALLBACK_NAME}`;
        script.async = true;
        script.defer = true;
        script.onerror = () => {
            // Allow a retry on the next interaction (e.g. after an ad-blocker/network failure)
            loadPromise = null;
            delete win[CALLBACK_NAME];
            script.remove();
            reject(new Error('Failed to load Google Maps'));
        };
        document.head.appendChild(script);
    });

    return loadPromise;
}
