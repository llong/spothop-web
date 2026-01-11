import { styled, alpha, useTheme } from '@mui/material/styles';
import Toolbar from '@mui/material/Toolbar';
import IconButton from '@mui/material/IconButton';
import Typography from '@mui/material/Typography';
import SearchIcon from '@mui/icons-material/Search';
import { Map, List, FilterList } from '@mui/icons-material';
import { useRef, useState } from 'react';
import { PlaceAutocomplete } from './PlaceAutocomplete';
import { NavigationItems } from './NavigationItems';
import { NotificationBell } from './NotificationBell';
import { userAtom } from 'src/atoms/auth';
import { useProfile } from 'src/hooks/useProfile';
import { getSpotsAtom, mapAtom, isGoogleMapsLoadedAtom } from 'src/atoms/map';
import { useMediaQuery, Box, Badge } from '@mui/material';
import { useNavigate, useLocation } from '@tanstack/react-router';
import { useAtom, useAtomValue } from 'jotai';
import { CloudOff } from '@mui/icons-material';
import { Tooltip, Chip } from '@mui/material';
import { viewAtom } from 'src/atoms/map';
import { isFiltersOpenAtom, filtersAtom } from 'src/atoms/spots';
import { useOnlineStatus } from 'src/hooks/useOnlineStatus';
import { FilterBar } from './FilterBar';

const Search = styled('div')(({ theme }) => ({
    position: 'relative',
    borderRadius: theme.shape.borderRadius,
    backgroundColor: alpha(theme.palette.common.black, 0.05),
    '&:hover': {
        backgroundColor: alpha(theme.palette.common.black, 0.10),
    },
    marginLeft: 0,
    flexGrow: 1,
    [theme.breakpoints.up('sm')]: {
        marginLeft: theme.spacing(3),
        marginRight: theme.spacing(3),
        width: 'auto',
    },
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

export default function SearchAppBar() {
    const isOnline = useOnlineStatus();
    const isLoaded = useAtomValue(isGoogleMapsLoadedAtom);
    const navigate = useNavigate();
    const location = useLocation();
    const isRootPage = location.pathname === '/';
    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down('lg'));
    const inputRef = useRef<HTMLInputElement>(null!);
    const map = useAtomValue(mapAtom);
    const getSpots = useAtomValue(getSpotsAtom);
    const user = useAtomValue(userAtom);
    // AppBar only needs identity for avatar, NOT full social/content data.
    const { profile } = useProfile(undefined, false);
    const [view, setView] = useAtom(viewAtom);
    const [isFiltersOpen, setIsFiltersOpen] = useAtom(isFiltersOpenAtom);
    const [filters, setFilters] = useAtom(filtersAtom);
    const [filterAnchorEl, setFilterAnchorEl] = useState<null | HTMLElement>(null);

    const activeFilterCount = [
        filters.difficulty && filters.difficulty !== 'all',
        filters.spot_type && filters.spot_type.length > 0,
        filters.is_lit,
        filters.kickout_risk !== undefined && filters.kickout_risk < 10
    ].filter(Boolean).length;

    const onPlaceSelect = (place: google.maps.places.PlaceResult) => {
        console.log('Place selected:', place);
        const lat = place.geometry?.location?.lat();
        const lng = place.geometry?.location?.lng();
        console.log('Lat/Lng:', lat, lng);
        if (lat && lng) {
            if (map) {
                map.flyTo([lat, lng], 12, {
                    duration: 1
                });
                if (getSpots) {
                    map.once('moveend', () => getSpots(map.getBounds()));
                }
            }
            navigate({ to: '/', search: { lat, lng } });
        }
        if (inputRef.current) {
            inputRef.current.value = '';
        }
    };

    if (!isLoaded) {
        return <div>Loading...</div>;
    }

    return (
        <Toolbar>
            <Typography
                variant="h6"
                noWrap
                component="div"
                sx={{ mr: 2, cursor: 'pointer', flexShrink: 0 }}
                onClick={() => navigate({ to: '/' })}
            >
                SpotHop
            </Typography>
            <Box sx={{ flexGrow: 1, display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 1 }}>
                {!isOnline && (
                    <Tooltip title="You are currently offline. Some features may be limited.">
                        <Chip
                            icon={<CloudOff sx={{ fontSize: '1rem !important' }} />}
                            label="Offline"
                            size="small"
                            color="error"
                            variant="outlined"
                            sx={{ borderRadius: 1, fontWeight: 700 }}
                        />
                    </Tooltip>
                )}
                {isOnline && isRootPage &&
                    <Search onClick={() => inputRef.current?.focus()}>
                        <SearchIconWrapper aria-label="Search icon">
                            <SearchIcon />
                        </SearchIconWrapper>
                        <PlaceAutocomplete
                            onPlaceSelect={onPlaceSelect}
                            inputRef={inputRef}
                            endAdornment={
                                <>
                                    <IconButton
                                        size="small"
                                        onClick={(e) => {
                                            setFilterAnchorEl(e.currentTarget);
                                            setIsFiltersOpen(!isFiltersOpen);
                                        }}
                                        aria-label="Toggle filters"
                                    >
                                        <Badge badgeContent={activeFilterCount} color="primary">
                                            <FilterList />
                                        </Badge>
                                    </IconButton>
                                    <FilterBar
                                        anchorEl={filterAnchorEl}
                                        filters={filters}
                                        onFiltersChange={setFilters}
                                    />
                                </>
                            }
                        />
                    </Search>
                }
                {isOnline && isMobile && isRootPage && (
                    <IconButton
                        color="inherit"
                        onClick={() => setView(view === 'map' ? 'list' : 'map')}
                        aria-label={view === 'map' ? 'Switch to list view' : 'Switch to map view'}
                    >
                        {view === 'map' ? <List /> : <Map />}
                    </IconButton>
                )}
                {!isMobile && (
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        {user && profile?.displayName && <NotificationBell />}
                        <NavigationItems />
                    </Box>
                )}
            </Box>
        </Toolbar>
    );
}
