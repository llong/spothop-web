import { Link, useNavigate, } from '@tanstack/react-router';
import { useEffect, useState } from 'react';
import {
    Container,
    Box,
    TextField,
    Button,
    Typography,
    Link as MuiLink,
    Alert,
} from '@mui/material';
import supabase from '../../../supabase';
import { useAtomValue } from 'jotai';
import { userAtom } from 'src/atoms/auth';

export function LoginForm() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState<string>('')
    const user = useAtomValue(userAtom)
    const navigate = useNavigate()

    useEffect(() => {
        if (user?.user.aud) {
            navigate({ to: '/' })
        }
    }, [user])


    const handleSubmit = async (event: React.FormEvent) => {
        event.preventDefault();
        const { data, error } = await supabase.auth.signInWithPassword({
            email,
            password
        })

        if (error) {
            setError(error.message)
        } else if (data) {
            navigate({ to: '/' })
        }
    };

    return (
        <Container component="main" maxWidth="xs">
            <Box
                sx={{
                    marginTop: 8,
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                }}
            >
                <Typography component="h1" variant="h5">
                    Sign in
                </Typography>
                {error && <Alert severity="error" sx={{ width: "100%", mt: 2 }}>{error}</Alert>}
                <Box component="form" onSubmit={handleSubmit} noValidate sx={{ mt: 1 }}>
                    <TextField
                        margin="normal"
                        required
                        fullWidth
                        id="email"
                        label="Email Address"
                        name="email"
                        autoComplete="email"
                        autoFocus
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                    />
                    <TextField
                        margin="normal"
                        required
                        fullWidth
                        name="password"
                        label="Password"
                        type="password"
                        id="password"
                        autoComplete="current-password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                    />
                    <Button
                        type="submit"
                        fullWidth
                        variant="contained"
                        sx={{ mt: 3, mb: 2 }}
                    >
                        Sign In
                    </Button>
                    <Box sx={{ textAlign: 'right', mt: 1 }}>
                        <MuiLink component={Link} to="/signup" variant="body2">
                            {"Don't have an account? Sign Up"}
                        </MuiLink>
                    </Box>
                </Box>
            </Box>
        </Container>
    );
}
