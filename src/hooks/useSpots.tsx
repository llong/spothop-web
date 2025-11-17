import { useCallback, useState } from "react";
import supabase from "src/supabase";
import { useAtom } from "jotai";
import { spotsAtom } from "src/atoms/spots";
import { LatLngBounds } from "leaflet";

export default function () {
    const [spots, setSpots] = useAtom(spotsAtom);
    const [error, setError] = useState<string | null>(null)

    const getSpots = useCallback(async (bounds: LatLngBounds) => {
        if (!bounds) return;
        try {
            // Clear spots before fetching new ones
            setSpots([]);

            const { data, error } = await supabase
                .rpc("spots_in_view", {
                    min_lat: bounds.getSouth(),
                    min_lng: bounds.getWest(),
                    max_lat: bounds.getNorth(),
                    max_lng: bounds.getEast(),
                })

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

            setSpots(data || []);
        } catch (error: any) {
            setError(error.message as string)
            console.error("Exception fetching spots:", error);
        }
    }, [setSpots]);

    return {
        spots,
        error,
        getSpots
    }
}
