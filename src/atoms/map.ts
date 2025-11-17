import { atom } from 'jotai';
import { LatLngBounds, Map } from 'leaflet';

export const mapAtom = atom<Map | null>(null);
export const getSpotsAtom = atom<(() => void) | null>(null);
export const boundsAtom = atom<LatLngBounds | null>(null);
