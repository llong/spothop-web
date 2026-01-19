const GOOGLE_MAPS_API_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;

export interface LocationInfo {
    city?: string;
    state?: string;
    country?: string;
    streetNumber?: string;
    street?: string;
    postalCode?: string;
    formattedAddress?: string;
}

const cache: Record<string, LocationInfo> = {};

export async function reverseGeocode(lat: number, lng: number): Promise<LocationInfo> {
    const cacheKey = `${lat.toFixed(4)},${lng.toFixed(4)}`;
    if (cache[cacheKey]) return cache[cacheKey];

    try {
        const response = await fetch(
            `https://maps.googleapis.com/maps/api/geocode/json?latlng=${lat},${lng}&key=${GOOGLE_MAPS_API_KEY}`
        );
        const data = await response.json();

        if (data.results && data.results.length > 0) {
            const result = data.results[0];

            const cityComponent = result.address_components.find((c: any) =>
                c.types.includes('locality') || c.types.includes('administrative_area_level_2')
            );

            const stateComponent = result.address_components.find((c: any) =>
                c.types.includes('administrative_area_level_1')
            );

            const countryComponent = result.address_components.find((c: any) =>
                c.types.includes('country')
            );

            const streetNumber = result.address_components.find((c: any) =>
                c.types.includes('street_number')
            )?.long_name;

            const route = result.address_components.find((c: any) =>
                c.types.includes('route')
            )?.long_name;

            // For some regions, the locality might be missing, use administrative_area_level_1 or 2 as fallback
            const city = cityComponent?.long_name ||
                result.address_components.find((c: any) => c.types.includes('administrative_area_level_2'))?.long_name;

            const postalCode = result.address_components.find((c: any) =>
                c.types.includes('postal_code')
            )?.long_name;

            const info = {
                city: city,
                state: stateComponent?.short_name,
                country: countryComponent?.long_name,
                streetNumber,
                street: route,
                postalCode,
                formattedAddress: result.formatted_address
            };

            cache[cacheKey] = info;
            return info;
        }
    } catch (e) {
        console.error("Reverse geocoding failed", e);
    }

    return {};
}
