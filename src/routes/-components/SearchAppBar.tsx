import { styled, alpha, useTheme } from '@mui/material/styles';
import Toolbar from '@mui/material/Toolbar';
import IconButton from '@mui/material/IconButton';
import Typography from '@mui/material/Typography';
import SearchIcon from '@mui/icons-material/Search';
import { Map, List, FilterList } from '@mui/icons-material';
import { useLoadScript } from '@react-google-maps/api';
import { useRef } from 'react';
import { PlaceAutocomplete } from './PlaceAutocomplete';
import { NavigationItems } from './NavigationItems';
import { NotificationBell } from './NotificationBell';
import { userAtom } from 'src/atoms/auth';
import { useProfile } from 'src/hooks/useProfile';
import { getSpotsAtom, mapAtom } from 'src/atoms/map';
import { useMediaQuery, Box, Badge } from '@mui/material';
import { useNavigate, useLocation } from '@tanstack/react-router';
import { useAtom, useAtomValue } from 'jotai';
import { viewAtom } from 'src/atoms/map';
import { isFiltersOpenAtom, filtersAtom } from 'src/atoms/spots';

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

const libraries: any = ["places"];

export default function SearchAppBar() {
    const navigate = useNavigate();
    const location = useLocation();
    const isRootPage = location.pathname === '/';
    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down('lg'));
    const { isLoaded } = useLoadScript({
        googleMapsApiKey: "AIzaSyA4RiC3UlcdfU3MRNkp0kBirRmSE8V9vdE",
        libraries,
    });
    const inputRef = useRef<HTMLInputElement>(null!);
    const map = useAtomValue(mapAtom);
    const getSpots = useAtomValue(getSpotsAtom);
    const user = useAtomValue(userAtom);
    // AppBar only needs identity for avatar, NOT full social/content data.
    const { profile } = useProfile(undefined, false);
    const [view, setView] = useAtom(viewAtom);
    const [isFiltersOpen, setIsFiltersOpen] = useAtom(isFiltersOpenAtom);
    const filters = useAtomValue(filtersAtom);

    const activeFilterCount = [
        filters.difficulty && filters.difficulty !== 'all',
        filters.spot_type && filters.spot_type.length > 0,
        filters.is_lit,
        filters.kickout_risk !== undefined && filters.kickout_risk < 10
    ].filter(Boolean).length;

    const onPlaceSelect = (place: google.maps.places.PlaceResult) => {
        const lat = place.geometry?.location?.lat();
        const lng = place.geometry?.location?.lng();
        if (lat && lng) {
            if (map && getSpots) {
                map.flyTo([lat, lng], 12, {
                    duration: 1
                });
                map.once('moveend', () => getSpots(map.getBounds()));
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
                {isRootPage &&
                    <Search onClick={() => inputRef.current?.focus()}>
                        <SearchIconWrapper>
                            <SearchIcon />
                        </SearchIconWrapper>
                        <PlaceAutocomplete
                            onPlaceSelect={onPlaceSelect}
                            inputRef={inputRef}
                            endAdornment={
                                <IconButton size="small" onClick={() => setIsFiltersOpen(!isFiltersOpen)}>
                                    <Badge badgeContent={activeFilterCount} color="primary">
                                        <FilterList />
                                    </Badge>
                                </IconButton>
                            }
                        />
                    </Search>
                }
                {isMobile && isRootPage && (
                    <IconButton color="inherit" onClick={() => setView(view === 'map' ? 'list' : 'map')}>
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
