/**
 * Calculates the great-circle distance between two points on the Earth's surface.
 * Returns the distance in meters.
 * Using Haversine formula.
 */
export function getDistance(
    point1: { latitude: number; longitude: number },
    point2: { latitude: number; longitude: number }
): number {
    const R = 6371e3; // metres
    const φ1 = point1.latitude * Math.PI / 180; // φ, λ in radians
    const φ2 = point2.latitude * Math.PI / 180;
    const Δφ = (point2.latitude - point1.latitude) * Math.PI / 180;
    const Δλ = (point2.longitude - point1.longitude) * Math.PI / 180;

    const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
        Math.cos(φ1) * Math.cos(φ2) *
        Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return R * c; // in metres
}
