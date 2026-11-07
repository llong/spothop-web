const CARTO_API_KEY = import.meta.env.VITE_CARTO_API_KEY;
const keyParam = CARTO_API_KEY ? `?key=${CARTO_API_KEY}` : '';

export const TILE_URLS = {
    light: `https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png${keyParam}`,
    dark: `https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png${keyParam}`,
};
