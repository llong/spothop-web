import { Link, useNavigate, useSearch } from '@tanstack/react-router';
import { useEffect, useState } from 'react';
import {
    Container,
    Box,
    TextField,
    Button,
    Typography,
    Link as MuiLink,
    Alert,
    Paper,
    Avatar,
    Stack
} from '@mui/material';
import LockOutlinedIcon from '@mui/icons-material/LockOutlined';
import supabase from '../../../supabase';
import { useAtomValue } from 'jotai';
import { userAtom } from 'src/atoms/auth';

export function LoginForm() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState<string>('')
    const { message } = useSearch({ from: '/login/' }) as any;
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
                <Paper
                    elevation={3}
                    sx={{
                        p: 4,
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        width: '100%',
                        borderRadius: 2
                    }}
                >
                    <Avatar sx={{ m: 1, bgcolor: 'secondary.main' }}>
                        <LockOutlinedIcon />
                    </Avatar>
                    <Typography component="h1" variant="h5" sx={{ mb: 3, fontWeight: 600 }}>
                        Sign in to SpotHop
                    </Typography>

                    {error && <Alert severity="error" sx={{ width: "100%", mb: 2 }}>{error}</Alert>}
                    {message === 'logged_out' && (
                        <Alert severity="success" sx={{ width: "100%", mb: 2 }}>
                            Successfully signed out.
                        </Alert>
                    )}

                    <Box component="form" onSubmit={handleSubmit} noValidate sx={{ width: '100%' }}>
                        <Stack spacing={2}>
                            <TextField
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
                        </Stack>

                        <Button
                            type="submit"
                            fullWidth
                            variant="contained"
                            size="large"
                            sx={{ mt: 3, mb: 2, py: 1.5, fontWeight: 'bold' }}
                        >
                            Sign In
                        </Button>

                        <Box sx={{ textAlign: 'center', mt: 2, display: 'flex', flexDirection: 'column', gap: 1 }}>
                            <MuiLink component={Link} to="/forgot-password" variant="body2" underline="hover">
                                Forgot password?
                            </MuiLink>
                            <MuiLink component={Link} to="/signup" variant="body2" underline="hover">
                                {"Don't have an account? Sign Up"}
                            </MuiLink>
                        </Box>
                    </Box>
                </Paper>
            </Box>
        </Container>
    );
}
