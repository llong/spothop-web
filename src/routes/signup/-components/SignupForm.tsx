import { Link } from '@tanstack/react-router';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
    Container,
    Box,
    TextField,
    Button,
    Typography,
    Stack,
    Alert,
    Snackbar,
    Link as MuiLink,
} from '@mui/material';
import supabase from 'src/supabase';
import { useState } from 'react';
import { FormControlLabel, Checkbox } from '@mui/material';

const signupSchema = z.object({
    email: z.string().email({ message: 'Invalid email address' }).trim(),
    password: z.string().min(6, { message: 'Password must be at least 6 characters' }),
    confirmPassword: z.string(),
    agreeToTerms: z.boolean().refine((val) => val === true, {
        message: "You must agree to the Terms of Service"
    }),
}).refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ['confirmPassword'],
});

type SignupFormInputs = z.infer<typeof signupSchema>;

export function SignupForm() {
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState(false);

    const { register, handleSubmit, formState: { errors, isValid } } = useForm<SignupFormInputs>({
        resolver: zodResolver(signupSchema),
        mode: 'onChange',
    });

    const onSubmit = async (data: SignupFormInputs) => {
        try {
            setIsLoading(true);
            setError(null);

            const { error: signupError } = await supabase.auth.signUp({
                email: data.email,
                password: data.password,
                options: {
                    // Using origin without /welcome to better match Supabase allowlist
                    emailRedirectTo: window.location.origin,
                },
            });

            if (signupError) throw signupError;

            setSuccess(true);
        } catch (err: any) {
            console.error('Signup error:', err);
            setError(err.message || 'An error occurred during signup.');
        } finally {
            setIsLoading(false);
        }
    };

    if (success) {
        return (
            <Container maxWidth="xs">
                <Box sx={{ mt: 12, textAlign: 'center' }}>
                    <Typography variant="h4" fontWeight={700} gutterBottom>
                        Check your email!
                    </Typography>
                    <Typography variant="body1" color="text.secondary" sx={{ mb: 4 }}>
                        We've sent a verification link to your email address. Once you click the link, you'll be able to set up your profile name and riding style.
                    </Typography>
                    <Button
                        variant="outlined"
                        fullWidth
                        onClick={() => setSuccess(false)}
                    >
                        Back to Sign Up
                    </Button>
                </Box>
            </Container>
        );
    }

    return (
        <Container component="main" maxWidth="xs">
            <Snackbar open={!!error} autoHideDuration={6000} onClose={() => setError(null)}>
                <Alert onClose={() => setError(null)} severity="error" sx={{ width: '100%' }}>
                    {error}
                </Alert>
            </Snackbar>

            <Box
                sx={{
                    marginTop: 8,
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                }}
            >
                <Box
                    component="img"
                    src="/spothopIcon.png"
                    alt="SpotHop Logo"
                    sx={{ height: 60, width: 'auto', mb: 2 }}
                />
                <Typography component="h1" variant="h5" sx={{ fontWeight: 900, mb: 3 }}>
                    Sign Up for SpotHop
                </Typography>
                <Box component="form" onSubmit={handleSubmit(onSubmit)} noValidate sx={{ mt: 1 }}>
                    <Stack spacing={2}>
                        <TextField
                            required
                            fullWidth
                            id="email"
                            label="Email Address"
                            {...register('email')}
                            error={!!errors.email}
                            helperText={errors.email?.message}
                        />
                        <TextField
                            required
                            fullWidth
                            label="Password"
                            type="password"
                            id="password"
                            {...register('password')}
                            error={!!errors.password}
                            helperText={errors.password?.message}
                        />
                        <TextField
                            required
                            fullWidth
                            label="Confirm Password"
                            type="password"
                            id="confirmPassword"
                            {...register('confirmPassword')}
                            error={!!errors.confirmPassword}
                            helperText={errors.confirmPassword?.message}
                        />
                        <FormControlLabel
                            control={
                                <Checkbox
                                    {...register('agreeToTerms')}
                                    color="primary"
                                />
                            }
                            label={
                                <Typography variant="body2">
                                    I agree to the <MuiLink component={Link} to="/terms" target="_blank">Terms of Service</MuiLink> and permit SpotHop to use my uploaded content.
                                </Typography>
                            }
                        />
                        {errors.agreeToTerms && (
                            <Typography variant="caption" color="error">
                                {errors.agreeToTerms.message}
                            </Typography>
                        )}
                    </Stack>
                    <Button
                        type="submit"
                        fullWidth
                        variant="contained"
                        disabled={isLoading || !isValid}
                        sx={{ mt: 3, mb: 2 }}
                    >
                        {isLoading ? 'Creating account...' : 'Sign Up'}
                    </Button>
                    <Box sx={{ textAlign: 'right' }}>
                        <MuiLink component={Link} to="/login" variant="body2">
                            Already have an account? Sign in
                        </MuiLink>
                    </Box>
                </Box>
            </Box>
        </Container>
    );
}
