import { describe, it, expect } from 'vitest';
import { getDistance } from '../geo';

describe('geo utils', () => {
    it('calculates distance between two points', () => {
        const p1 = { latitude: 0, longitude: 0 };
        const p2 = { latitude: 0, longitude: 1 }; // Approx 111km at equator
        
        const dist = getDistance(p1, p2);
        expect(dist).toBeGreaterThan(111000);
        expect(dist).toBeLessThan(112000);
    });

    it('returns 0 for same point', () => {
        const p1 = { latitude: 50, longitude: 10 };
        expect(getDistance(p1, p1)).toBe(0);
    });
});
