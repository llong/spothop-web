import { createLazyFileRoute, getRouteApi } from '@tanstack/react-router';
import { Box, Typography, useTheme, useMediaQuery, CircularProgress, IconButton, Stack, Badge, styled } from "@mui/material";
import FilterListIcon from '@mui/icons-material/FilterList';
import SearchIcon from '@mui/icons-material/Search';
import useSpots from 'src/hooks/useSpots';
import SpotsListCard from '../-components/SpotsListCard';
import { useEffect, lazy, Suspense, useState, useRef, useMemo } from 'react';
import { useAtom, useSetAtom } from 'jotai';
import { getSpotsAtom, viewAtom } from 'src/atoms/map';
import { SpotListSkeleton } from './-components/SpotCardSkeleton';
import { useOnlineStatus } from 'src/hooks/useOnlineStatus';
import type { Spot } from 'src/types';
import { PlaceAutocomplete } from '../-components/PlaceAutocomplete';
import { FilterBar } from '../-components/FilterBar';
import { isFiltersOpenAtom, filtersAtom } from 'src/atoms/spots';
import { rightSidebarAtom } from 'src/atoms/ui';
import { useMapSearch } from 'src/hooks/useMapSearch';

const Search = styled('div')(({ theme }) => ({
    position: 'relative',
    borderRadius: 9999,
    backgroundColor: '#eff3f4',
    '&:hover': {
        backgroundColor: '#e2e8f0',
    },
    width: '100%',
    marginBottom: theme.spacing(2),
}));

const SearchIconWrapper = styled('div')(({ theme }) => ({
    padding: theme.spacing(0, 2),
    height: '100%',
    position: 'absolute',
    pointerEvents: 'none',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
}));

// Lazy load the Map component
const SpotMap = lazy(() => import('../-components/SpotMap').then(m => ({ default: m.SpotMap })));

export const Route = createLazyFileRoute('/spots/')({
    component: SpotsIndex,
});

const routeApi = getRouteApi('/spots/');

function SpotsIndex() {
    const isOnline = useOnlineStatus();
    const { lat, lng } = routeApi.useSearch();
    const theme = useTheme();
    const isLargeScreen = useMediaQuery(theme.breakpoints.up('lg'));
    const isMobile = useMediaQuery(theme.breakpoints.down('lg'));
    const [view] = useAtom(viewAtom);
    const { spots, getSpots, isLoading } = useSpots()
    const setGetSpotsAtom = useSetAtom(getSpotsAtom);
    const setRightSidebarContent = useSetAtom(rightSidebarAtom);

    useEffect(() => {
        setGetSpotsAtom(() => getSpots);
    }, [getSpots, setGetSpotsAtom]);

    const handleSpotClick = (_spot: Spot) => {
        // No-op or handle map selection without drawer
    };

    const inputRef = useRef<HTMLInputElement>(null!);
    const { handlePlaceSelect } = useMapSearch();
    const [isFiltersOpen, setIsFiltersOpen] = useAtom(isFiltersOpenAtom);
    const [filters, setFilters] = useAtom(filtersAtom);
    const [filterAnchorEl, setFilterAnchorEl] = useState<null | HTMLElement>(null);

    const activeFilterCount = [
        filters.difficulty && filters.difficulty !== 'all',
        filters.spot_type && filters.spot_type.length > 0,
        filters.is_lit,
        filters.kickout_risk !== undefined && filters.kickout_risk < 10
    ].filter(Boolean).length;

    const searchInput = useMemo(() => (
        <Search onClick={() => inputRef.current?.focus()} sx={{ mb: isMobile ? 0 : 2 }}>
            <SearchIconWrapper>
                <SearchIcon />
            </SearchIconWrapper>
            <PlaceAutocomplete
                onPlaceSelect={handlePlaceSelect}
                inputRef={inputRef}
                placeholder="Search for spots..."
                endAdornment={
                    <Stack direction="row" alignItems="center" spacing={1} sx={{ pr: 1 }}>
                        <IconButton
                            size="small"
                            onClick={(e) => {
                                setFilterAnchorEl(e.currentTarget);
                                setIsFiltersOpen(!isFiltersOpen);
                            }}
                            aria-label="Toggle filters"
                        >
                            <Badge badgeContent={activeFilterCount} color="primary">
                                <FilterListIcon />
                            </Badge>
                        </IconButton>
                        <FilterBar
                            anchorEl={filterAnchorEl}
                            filters={filters}
                            onFiltersChange={setFilters}
                        />
                    </Stack>
                }
            />
        </Search>
    ), [handlePlaceSelect, inputRef, setFilterAnchorEl, setIsFiltersOpen, isFiltersOpen, activeFilterCount, filters, setFilters, isMobile]);

    const listContent = (
        <Box sx={{ p: 2 }}>
            {!isMobile && (
                <Box sx={{ px: 1 }}>
                    {searchInput}
                </Box>
            )}
            {isLoading ? (
                <SpotListSkeleton />
            ) : (
                <Stack spacing={2}>
                    {spots.length > 0 ? (
                        spots.map((spot, index) => (
                            <SpotsListCard key={spot.id} spot={spot} priority={index === 0} />
                        ))
                    ) : (
                        <Typography color="text.secondary" sx={{ textAlign: 'center', mt: 4 }}>
                            No spots found in this area.
                        </Typography>
                    )}
                </Stack>
            )}
        </Box>
    );

    useEffect(() => {
        if (isLargeScreen) {
            setRightSidebarContent(listContent);
        } else {
            setRightSidebarContent(null);
        }
        return () => setRightSidebarContent(null);
    }, [isLargeScreen, listContent, setRightSidebarContent]);

    // Force list view when offline
    const mapVisible = isOnline && (!isMobile || view === 'map');
    const listVisible = !isOnline || !isMobile || view === 'list';

    return (
        <Box sx={{ height: isMobile ? 'calc(100vh - 128px)' : '100vh', overflow: 'hidden', position: 'relative' }}>
            <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
                {mapVisible && (
                    <Box sx={{ flexGrow: 1, position: 'relative', overflow: 'hidden' }}>
                        <Suspense fallback={
                            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%', bgcolor: 'grey.100' }}>
                                <CircularProgress />
                            </Box>
                        }>
                            <SpotMap
                                spots={spots}
                                getSpots={getSpots}
                                onMarkerClick={handleSpotClick}
                                lat={lat}
                                lng={lng}
                            />
                        </Suspense>
                    </Box>
                )}
                {!isLargeScreen && listVisible && (
                    <Box sx={{ height: view === 'list' ? '100%' : 'auto', overflowY: 'auto', bgcolor: 'grey.100' }}>
                        {listContent}
                    </Box>
                )}
            </Box>

        </Box>
    )
}
