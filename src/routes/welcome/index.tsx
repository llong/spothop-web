import { createFileRoute, redirect, useNavigate } from '@tanstack/react-router';
import {
    Container,
    Box,
    Typography,
    TextField,
    Button,
    FormControl,
    InputLabel,
    Select,
    MenuItem,
    Stack,
    Paper,
    Alert,
    CircularProgress
} from '@mui/material';
import { useState, useEffect } from 'react';
import { useAtomValue, useSetAtom } from 'jotai';
import { userAtom, profileAtom } from 'src/atoms/auth';
import { useQueryClient } from '@tanstack/react-query';
import { profileKeys } from 'src/hooks/useProfileQueries';
import supabase from 'src/supabase';
import type { RiderType } from 'src/types';

const RESERVED_KEYWORDS = [
    'admin', 'administrator', 'root', 'superuser', 'sysadmin',
    'support', 'help', 'info', 'contact', 'security', 'mod', 'moderator',
    'staff', 'team', 'official', 'verified', 'system',
    'api', 'v1', 'v2', 'static', 'assets', 'public', 'private',
    'login', 'logout', 'signin', 'signup', 'register', 'portal',
    'settings', 'profile', 'account', 'dashboard', 'config', 'billing',
    'index', 'home', 'test', 'dev', 'developer',
    'spothop', 'props'
];

const WelcomeComponent = () => {
    const user = useAtomValue(userAtom);
    const setProfile = useSetAtom(profileAtom);
    const queryClient = useQueryClient();
    const navigate = useNavigate();

    const [displayName, setDisplayName] = useState('');
    const [riderType, setRiderType] = useState<RiderType | ''>('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Pre-populate display name from email prefix
    useEffect(() => {
        if (user?.user.email && !displayName) {
            const prefix = user.user.email.split('@')[0];
            // Clean prefix (remove special chars, etc if desired, but user can edit)
            setDisplayName(prefix);
        }
    }, [user]);

    const validateDisplayName = (name: string) => {
        const trimmed = name.trim().toLowerCase();

        if (trimmed.length < 2) return 'Name is too short.';
        if (trimmed.length > 50) return 'Name is too long.';

        if (RESERVED_KEYWORDS.includes(trimmed)) {
            return `"${name}" is a reserved keyword and cannot be used.`;
        }

        return null;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);

        if (!user) return;

        const validationError = validateDisplayName(displayName);
        if (validationError) {
            setError(validationError);
            return;
        }

        if (!riderType) {
            setError('Please select your riding style.');
            return;
        }

        try {
            setIsSubmitting(true);

            // Use upsert to create the profile record if it doesn't exist (e.g. for new users)
            const { data: updatedProfile, error: updateError } = await supabase
                .from('profiles')
                .upsert({
                    id: user.user.id,
                    displayName: displayName.trim(),
                    riderType: riderType,
                    // If username is null, set it to the email prefix as a fallback unique ID
                    username: user.user.email?.split('@')[0] || user.user.id,
                    updatedAt: new Date().toISOString()
                })
                .select()
                .single();

            if (updateError) throw updateError;

            if (updatedProfile) {
                // 1. Update the local atom
                setProfile(updatedProfile as any);

                // 2. Invalidate the TanStack Query cache so RootComponent gets fresh data
                await queryClient.invalidateQueries({
                    queryKey: profileKeys.detail(user.user.id)
                });
            }

            // Success! Go to home
            navigate({ to: '/' });
        } catch (err: any) {
            console.error('Onboarding error:', err);
            setError(err.message || 'Failed to save profile.');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <Container maxWidth="sm">
            <Box sx={{ mt: 8, mb: 4 }}>
                <Paper elevation={3} sx={{ p: 4, borderRadius: 2 }}>
                    <Typography variant="h4" fontWeight={800} gutterBottom align="center">
                        Welcome to SpotHop! 🛹
                    </Typography>
                    <Typography variant="body1" color="text.secondary" align="center" sx={{ mb: 4 }}>
                        Let's set up your profile so the community knows who you are.
                    </Typography>

                    {error && <Alert severity="error" sx={{ mb: 3 }}>{error}</Alert>}

                    <Box component="form" onSubmit={handleSubmit} noValidate>
                        <Stack spacing={3}>
                            <TextField
                                required
                                fullWidth
                                label="Display Name"
                                value={displayName}
                                onChange={(e) => setDisplayName(e.target.value)}
                                helperText="How you'll appear to others. You can change this later."
                                inputProps={{ maxLength: 50 }}
                            />

                            <FormControl fullWidth required>
                                <InputLabel id="rider-type-label">What do you ride?</InputLabel>
                                <Select
                                    labelId="rider-type-label"
                                    value={riderType}
                                    label="What do you ride?"
                                    onChange={(e) => setRiderType(e.target.value as RiderType)}
                                >
                                    <MenuItem value="inline">Inline Skates</MenuItem>
                                    <MenuItem value="skateboard">Skateboard</MenuItem>
                                    <MenuItem value="bmx">BMX</MenuItem>
                                    <MenuItem value="scooter">Scooter</MenuItem>
                                </Select>
                            </FormControl>

                            <Button
                                type="submit"
                                fullWidth
                                variant="contained"
                                size="large"
                                disabled={isSubmitting}
                                sx={{ py: 1.5, fontWeight: 'bold' }}
                            >
                                {isSubmitting ? <CircularProgress size={24} color="inherit" /> : "Complete Setup"}
                            </Button>
                        </Stack>
                    </Box>
                </Paper>
            </Box>
        </Container>
    );
};

export const Route = createFileRoute('/welcome/')({
    component: WelcomeComponent,
    beforeLoad: async () => {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) {
            throw redirect({ to: '/login' });
        }
    },
});
