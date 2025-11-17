import { useCallback, useEffect, useState } from "react";
import supabase from "src/supabase";
import { useAtomValue } from "jotai";
import { boundsAtom } from "src/atoms/map";

export default function () {
    const [spots, setSpots] = useState<any[]>([]);
    const [error, setError] = useState<string | null>(null)
    const bounds = useAtomValue(boundsAtom);

    const getSpots = useCallback(async () => {
        const currentBounds = bounds;
        if (!currentBounds) return;
        try {
            const { data, error } = await supabase
                .rpc("spots_in_view", {
                    min_lat: currentBounds.getSouth(),
                    min_lng: currentBounds.getWest(),
                    max_lat: currentBounds.getNorth(),
                    max_lng: currentBounds.getEast(),
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
    }, [bounds]);

    useEffect(() => {
        if (bounds) {
            getSpots();
        }
    }, [bounds, getSpots]);

    return {
        spots,
        error,
        getSpots
    }
}
