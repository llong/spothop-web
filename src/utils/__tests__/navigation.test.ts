import { describe, it, expect, vi, beforeEach } from 'vitest';
import { navigationUtils } from '../navigation';

describe('navigationUtils', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        // Mock window.location
        const locationMock = {
            ...window.location,
            href: '',
            reload: vi.fn(),
        };
        Object.defineProperty(window, 'location', {
            value: locationMock,
            writable: true,
        });
    });

    it('redirectTo sets window.location.href', () => {
        navigationUtils.redirectTo('/test');
        expect(window.location.href).toBe('/test');
    });

    it('reload calls window.location.reload', () => {
        navigationUtils.reload();
        expect(window.location.reload).toHaveBeenCalled();
    });

    it('redirectWithMessage appends message to query params', () => {
        navigationUtils.redirectWithMessage('/home', 'Welcome');
        expect(window.location.href).toBe('/home?message=Welcome');

        navigationUtils.redirectWithMessage('/home?tab=1', 'Welcome');
        expect(window.location.href).toBe('/home?tab=1&message=Welcome');
    });

    it('redirectWithParam appends key-value to query params', () => {
        navigationUtils.redirectWithParam('/search', 'q', 'spots');
        expect(window.location.href).toBe('/search?q=spots');
    });
});
