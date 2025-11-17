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
    Link as MuiLink,
} from '@mui/material';

const signupSchema = z.object({
    email: z.string().email({ message: 'Invalid email address' }).trim(),
    password: z.string().min(6, { message: 'Password must be at least 6 characters' }),
    confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ['confirmPassword'],
});

type SignupFormInputs = z.infer<typeof signupSchema>;

export function SignupForm() {
    const { register, handleSubmit, formState: { errors } } = useForm<SignupFormInputs>({
        resolver: zodResolver(signupSchema),
    });

    const onSubmit = (data: SignupFormInputs) => {
        // Handle signup logic here
        console.log(data);
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
                    Sign up
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
                    </Stack>
                    <Button
                        type="submit"
                        fullWidth
                        variant="contained"
                        sx={{ mt: 3, mb: 2 }}
                    >
                        Sign Up
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
