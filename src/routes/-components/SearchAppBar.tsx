import { styled, alpha } from '@mui/material/styles';
import AppBar from '@mui/material/AppBar';
import Box from '@mui/material/Box';
import Toolbar from '@mui/material/Toolbar';
import IconButton from '@mui/material/IconButton';
import Typography from '@mui/material/Typography';
import MenuIcon from '@mui/icons-material/Menu';
import SearchIcon from '@mui/icons-material/Search';
import { useLoadScript } from '@react-google-maps/api';
import { useRef } from 'react';
import { useAtomValue } from 'jotai';
import { PlaceAutocomplete } from './PlaceAutocomplete';
import { getSpotsAtom, mapAtom } from 'src/atoms/map';
import { userAtom } from 'src/atoms/auth';
import { Button } from '@mui/material';
import { Link } from '@tanstack/react-router';
import supabase from 'src/supabase';

const Search = styled('div')(({ theme }) => ({
    position: 'relative',
    borderRadius: theme.shape.borderRadius,
    backgroundColor: alpha(theme.palette.common.white, 0.15),
    '&:hover': {
        backgroundColor: alpha(theme.palette.common.white, 0.25),
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
    const { isLoaded } = useLoadScript({
        googleMapsApiKey: "AIzaSyA4RiC3UlcdfU3MRNkp0kBirRmSE8V9vdE",
        libraries,
    });
    const inputRef = useRef<HTMLInputElement>(null);
    const map = useAtomValue(mapAtom);
    const getSpots = useAtomValue(getSpotsAtom);
    const user = useAtomValue(userAtom);

    const onPlaceSelect = (place: google.maps.places.PlaceResult) => {
        const lat = place.geometry?.location?.lat();
        const lng = place.geometry?.location?.lng();
        if (lat && lng && map && getSpots) {
            map.flyTo([lat, lng], 12, {
                duration: 1
            });
            getSpots();
        }
        if (inputRef.current) {
            inputRef.current.value = '';
        }
    };

    if (!isLoaded) {
        return <div>Loading...</div>;
    }

    return (
        <Box sx={{ flexGrow: 1 }}>
            <AppBar position="static">
                <Toolbar>
                    <IconButton
                        size="large"
                        edge="start"
                        color="inherit"
                        aria-label="open drawer"
                        sx={{ mr: 2 }}
                    >
                        <MenuIcon />
                    </IconButton>
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
                        <PlaceAutocomplete onPlaceSelect={onPlaceSelect} />
                    </Search>
                    {!user?.user.aud ?
                        <Button color="inherit" component={Link} to="/login">
                            Login
                        </Button> : <Button color="inherit" onClick={() => supabase.auth.signOut()}>
                            Sign Out
                        </Button>}
                </Toolbar>
            </AppBar>
        </Box>
    );
}
