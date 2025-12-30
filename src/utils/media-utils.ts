import { reverseGeocode } from "./geocoding";
import type { UserMediaItem } from "../types";

/**
 * Ensures city, state, and country are present. 
 * If missing, it performs reverse geocoding.
 */
export const enrichLocation = async <T extends { latitude: number; longitude: number; city?: string | null; state?: string | null; country?: string | null }>(
    item: T
) => {
    if (item.city && item.state && item.country) return item;

    try {
        const info = await reverseGeocode(item.latitude, item.longitude);
        return {
            ...item,
            city: item.city || info.city,
            state: item.state || info.state,
            country: item.country || info.country,
        };
    } catch (error) {
        console.error("Geocoding failed for item:", item, error);
        return item;
    }
};

/**
 * Selects a random photo from a spot's photo array or returns null.
 */
export const getSpotThumbnail = (spotPhotos: { url: string }[] | null | undefined) => {
    if (!spotPhotos || spotPhotos.length === 0) return null;
    const randomIndex = Math.floor(Math.random() * spotPhotos.length);
    return spotPhotos[randomIndex].url;
};

/**
 * Formats raw Supabase media (photos/videos) into a consistent UserMediaItem.
 */
export const formatMediaItem = async (m: any, type: 'photo' | 'video'): Promise<UserMediaItem> => {
    const enrichedSpot = m.spots ? await enrichLocation(m.spots) : null;

    return {
        id: m.id,
        url: m.url,
        thumbnailUrl: type === 'video' ? m.thumbnail_url : undefined,
        type,
        created_at: m.created_at,
        spot: {
            id: enrichedSpot?.id || m.spots?.id || 'unknown',
            name: enrichedSpot?.name || m.spots?.name || 'Unknown Spot',
            city: enrichedSpot?.city || m.spots?.city || 'Unknown City',
            country: enrichedSpot?.country || m.spots?.country || 'Unknown Country'
        }
    };
};
