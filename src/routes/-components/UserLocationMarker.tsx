import { useState, useEffect, memo } from "react";
import { Circle } from "react-leaflet";

interface UserLocationMarkerProps {
    location: { lat: number; lng: number };
    circleSize: number;
}

/**
 * Optimized Pulse Animation Component
 * Limits re-renders to just the user location circles
 */
export const UserLocationMarker = memo(({ location, circleSize }: UserLocationMarkerProps) => {
    const [pulseRings, setPulseRings] = useState<Array<{ id: number; radius: number; opacity: number }>>([]);

    useEffect(() => {
        const addRing = () => {
            const id = Date.now();
            setPulseRings(prev => [...prev, { id, radius: circleSize, opacity: 0.6 }]);
        };
        const interval = setInterval(addRing, 2000);
        return () => clearInterval(interval);
    }, [circleSize]);

    useEffect(() => {
        const animationInterval = setInterval(() => {
            setPulseRings(prev =>
                prev
                    .map(ring => ({
                        ...ring,
                        radius: Math.min(ring.radius + circleSize / 25, circleSize * 2.2),
                        opacity: Math.max(ring.opacity - 0.012, 0),
                    }))
                    .filter(ring => ring.opacity > 0)
            );
        }, 50);
        return () => clearInterval(animationInterval);
    }, [circleSize]);

    return (
        <>
            <Circle
                center={[location.lat, location.lng]}
                radius={circleSize * 0.48}
                pathOptions={{
                    color: "#4285F4",
                    fillColor: "#4285F4",
                    fillOpacity: 1,
                    weight: 0,
                }}
            />
            {pulseRings.map(ring => (
                <Circle
                    key={ring.id}
                    center={[location.lat, location.lng]}
                    radius={circleSize * (ring.radius / 25)}
                    pathOptions={{
                        color: "transparent",
                        fillColor: "#4285F4",
                        fillOpacity: ring.opacity,
                        weight: 0,
                    }}
                />
            ))}
        </>
    );
});