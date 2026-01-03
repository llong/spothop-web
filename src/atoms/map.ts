import { atom } from 'jotai';
import type { LatLngBounds, Map } from 'leaflet';

export const mapAtom = atom<Map | null>(null);
mapAtom.debugLabel = 'map';
export const getSpotsAtom = atom<((bounds: LatLngBounds) => void) | null>(null);
getSpotsAtom.debugLabel = 'getSpots';
export const boundsAtom = atom<LatLngBounds | null>(null);
boundsAtom.debugLabel = 'bounds';

export const viewAtom = atom<'map' | 'list'>('map');
viewAtom.debugLabel = 'view';
