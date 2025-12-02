import { styled, alpha, useTheme } from '@mui/material/styles';
import Toolbar from '@mui/material/Toolbar';
import IconButton from '@mui/material/IconButton';
import Typography from '@mui/material/Typography';
import SearchIcon from '@mui/icons-material/Search';
import { Map, List } from '@mui/icons-material';
import { useLoadScript } from '@react-google-maps/api';
import { useRef } from 'react';
import { useAtomValue } from 'jotai';
import { PlaceAutocomplete } from './PlaceAutocomplete';
import { getSpotsAtom, mapAtom } from 'src/atoms/map';
import { userAtom } from 'src/atoms/auth';
import { Button, useMediaQuery, Stack } from '@mui/material';
import { Link, useNavigate, useLocation } from '@tanstack/react-router';
import supabase from 'src/supabase';
import { Home, AccountCircle, Login, Logout } from '@mui/icons-material';
import { useAtom } from 'jotai';
import { viewAtom } from 'src/atoms/map';

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
    const [view, setView] = useAtom(viewAtom);

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
                sx={{ flexShrink: 1, display: { xs: 'none', sm: 'block' } }}
            >
                SpotHop
            </Typography>
            <Search onClick={() => inputRef.current?.focus()}>
                <SearchIconWrapper>
                    <SearchIcon />
                </SearchIconWrapper>
                <PlaceAutocomplete onPlaceSelect={onPlaceSelect} inputRef={inputRef} />
            </Search>
            {isMobile && location.pathname === '/' && (
                <IconButton color="inherit" onClick={() => setView(view === 'map' ? 'list' : 'map')}>
                    {view === 'map' ? <List /> : <Map />}
                </IconButton>
            )}
            {!isMobile && (
                <Stack direction="row" spacing={2}>
                    <Button color="inherit" component={Link} to="/" startIcon={<Home />}>
                        Spots
                    </Button>
                    <Button color="inherit" component={Link} to="/profile" startIcon={<AccountCircle />}>
                        Profile
                    </Button>
                    {!user?.user.aud ? (
                        <Button color="inherit" component={Link} to="/login" startIcon={<Login />}>
                            Login
                        </Button>
                    ) : (
                        <Button color="inherit" onClick={() => supabase.auth.signOut()} startIcon={<Logout />}>
                            Sign Out
                        </Button>
                    )}
                </Stack>
            )}
        </Toolbar>
    );
}
