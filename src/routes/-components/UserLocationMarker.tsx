import { memo } from "react";
import { Marker } from "react-leaflet";
import { divIcon } from "leaflet";

const SIZE = 36;

/** A blue dot with a pulsing ring. The pulse is a CSS animation (see index.css), so it costs no React renders. */
const icon = divIcon({
    html: '<div class="user-location-dot"></div>',
    className: "user-location-marker",
    iconSize: [SIZE, SIZE],
    iconAnchor: [SIZE / 2, SIZE / 2],
});

export const UserLocationMarker = memo(({ location }: { location: { lat: number; lng: number } }) => (
    <Marker position={[location.lat, location.lng]} icon={icon} interactive={false} keyboard={false} zIndexOffset={-1000} />
));
