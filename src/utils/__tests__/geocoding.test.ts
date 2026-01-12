import { describe, it, expect, vi, beforeEach } from 'vitest';
import { reverseGeocode } from '../geocoding';

describe('geocoding util', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        window.fetch = vi.fn();
    });

    it('returns empty object if no results', async () => {
        vi.mocked(window.fetch).mockResolvedValue({
            json: () => Promise.resolve({ results: [] })
        } as any);

        const result = await reverseGeocode(1, 2);
        expect(result).toEqual({});
    });

    it('parses address components correctly', async () => {
        const mockResponse = {
            results: [{
                formatted_address: '123 Test St, Test City, TS 12345, Test Country',
                address_components: [
                    { long_name: '123', types: ['street_number'] },
                    { long_name: 'Test St', types: ['route'] },
                    { long_name: 'Test City', types: ['locality'] },
                    { short_name: 'TS', types: ['administrative_area_level_1'] },
                    { long_name: 'Test Country', types: ['country'] }
                ]
            }]
        };

        vi.mocked(window.fetch).mockResolvedValue({
            json: () => Promise.resolve(mockResponse)
        } as any);

        const result = await reverseGeocode(1, 2);
        expect(result.streetNumber).toBe('123');
        expect(result.street).toBe('Test St');
        expect(result.city).toBe('Test City');
        expect(result.state).toBe('TS');
        expect(result.country).toBe('Test Country');
        expect(result.formattedAddress).toBe(mockResponse.results[0].formatted_address);
    });

    it('uses cache for same coordinates', async () => {
        const mockResponse = {
            results: [{
                formatted_address: 'Cached Address',
                address_components: []
            }]
        };

        vi.mocked(window.fetch).mockResolvedValue({
            json: () => Promise.resolve(mockResponse)
        } as any);

        await reverseGeocode(10, 20);
        await reverseGeocode(10, 20);

        expect(window.fetch).toHaveBeenCalledTimes(1);
    });
});
