import { useTheme, styled } from '@mui/material/styles';
import Toolbar from '@mui/material/Toolbar';
import IconButton from '@mui/material/IconButton';
import Typography from '@mui/material/Typography';
import { Map, List, Search as SearchIcon, FilterList as FilterListIcon } from '@mui/icons-material';
import { NavigationItems } from './NavigationItems';
import { NotificationBell } from './NotificationBell';
import { userAtom } from 'src/atoms/auth';
import { useProfile } from 'src/hooks/useProfile';
import { isGoogleMapsLoadedAtom, viewAtom } from 'src/atoms/map';
import { useMediaQuery, Box, Badge, Stack } from '@mui/material';
import { useNavigate, useLocation } from '@tanstack/react-router';
import { useAtom, useAtomValue } from 'jotai';
import { CloudOff } from '@mui/icons-material';
import { Tooltip, Chip } from '@mui/material';
import { useOnlineStatus } from 'src/hooks/useOnlineStatus';
import { PlaceAutocomplete } from './PlaceAutocomplete';
import { FilterBar } from './FilterBar';
import { isFiltersOpenAtom, filtersAtom } from 'src/atoms/spots';
import { useRef, useState } from 'react';
import { useMapSearch } from 'src/hooks/useMapSearch'; // Import new hook

const Search = styled('div')(() => ({
    position: 'relative',
    borderRadius: 9999,
    backgroundColor: '#eff3f4',
    '&:hover': {
        backgroundColor: '#e2e8f0',
    },
    width: '100%',
    display: 'flex',
    alignItems: 'center',
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
    const isSpotsPage = location.pathname === '/spots';
    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down('lg'));
    const user = useAtomValue(userAtom);
    // AppBar only needs identity for avatar, NOT full social/content data.
    const { profile } = useProfile(undefined, false);
    const [view, setView] = useAtom(viewAtom);
    
    const { handlePlaceSelect } = useMapSearch(); // Use new hook
    const [isFiltersOpen, setIsFiltersOpen] = useAtom(isFiltersOpenAtom);
    const [filters, setFilters] = useAtom(filtersAtom);
    const [filterAnchorEl, setFilterAnchorEl] = useState<null | HTMLElement>(null);
    const inputRef = useRef<HTMLInputElement>(null!);

    const activeFilterCount = [
        filters.difficulty && filters.difficulty !== 'all',
        filters.spot_type && filters.spot_type.length > 0,
        filters.is_lit,
        filters.kickout_risk !== undefined && filters.kickout_risk < 10
    ].filter(Boolean).length;

    if (!isLoaded) {
        return <div>Loading...</div>;
    }

    return (
        <Toolbar sx={{ gap: 1 }}>
            <Typography
                variant="h6"
                noWrap
                component="div"
                sx={{ cursor: 'pointer', flexShrink: 0, fontWeight: 900 }}
                onClick={() => navigate({ to: '/feed' })}
            >
                SpotHop
            </Typography>

            {isMobile && isSpotsPage && (
                <Box sx={{ flexGrow: 1, minWidth: 0 }}>
                    <Search onClick={() => inputRef.current?.focus()}>
                        <SearchIconWrapper>
                            <SearchIcon />
                        </SearchIconWrapper>
                        <PlaceAutocomplete
                            onPlaceSelect={handlePlaceSelect}
                            inputRef={inputRef}
                            placeholder="Search spots..."
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
                </Box>
            )}

            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 1, flexShrink: 0 }}>
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
                {isOnline && isMobile && isSpotsPage && (
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
