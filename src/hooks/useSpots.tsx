import { useCallback, useState } from "react";
import supabase from "src/supabase";
import { useAtom, useAtomValue } from "jotai";
import { spotsAtom, filtersAtom } from "src/atoms/spots";
import type { LatLngBounds } from "leaflet";

export default function () {
    const [spots, setSpots] = useAtom(spotsAtom);
    const filters = useAtomValue(filtersAtom);
    const [error, setError] = useState<string | null>(null)
    const [isLoading, setIsLoading] = useState(false)

    const getSpots = useCallback(async (bounds: LatLngBounds) => {
        if (!bounds) return;
        setIsLoading(true);
        try {
            // Simplified query for better performance on map view
            // Counting favorites/comments for every spot in view can be very slow.
            // We use a small subset of columns to speed up the transfer and processing.
            let query = supabase
                .from('spots')
                .select('id, name, latitude, longitude, difficulty, kickout_risk, is_lit, spot_type, created_at, spot_photos(url)')
                .gte('latitude', bounds.getSouth())
                .lte('latitude', bounds.getNorth())
                .gte('longitude', bounds.getWest())
                .lte('longitude', bounds.getEast());

            if (filters) {
                if (filters.difficulty && filters.difficulty !== 'all') {
                    query = query.eq('difficulty', filters.difficulty);
                }
                if (filters.is_lit !== undefined) {
                    query = query.eq('is_lit', filters.is_lit);
                }
                if (filters.kickout_risk !== undefined) {
                    query = query.lte('kickout_risk', filters.kickout_risk);
                }
                if (filters.spot_type && filters.spot_type.length > 0) {
                    query = query.overlaps('spot_type', filters.spot_type);
                }
            }

            const { data, error } = await query;

            if (error) {
                console.error("Error fetching spots:", error);
                console.error("Error details:", {
                    message: error.message,
                    details: error.details,
                    hint: error.hint,
                    code: error.code
                });
                return;
            }

            if (data) {
                const formattedSpots = data.map((spot: any) => ({
                    ...spot,
                    // Map created_at to updated_at for compatibility if needed, or just use created_at
                    // But SpotsListCard checks updated_at. Let's inspect types again if possible, but for now fallback to created_at
                    updated_at: spot.created_at,
                    updatedAt: spot.created_at, // Provide both to be safe
                    photoUrl: spot.spot_photos?.[0]?.url || null,
                    favoriteCount: 0, // Removed subqueries for performance
                    commentCount: 0
                }));

                setSpots(formattedSpots);
            } else {
                setSpots([]);
            }
        } catch (error: any) {
            setError(error.message as string)
            console.error("Exception fetching spots:", error);
        } finally {
            setIsLoading(false);
        }
    }, [setSpots, filters]);

    return {
        spots,
        error,
        isLoading,
        getSpots
    }
}
