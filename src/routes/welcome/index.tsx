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
import { useState, useEffect, useMemo } from 'react';
import { useAtomValue, useSetAtom } from 'jotai';
import { userAtom, profileAtom } from 'src/atoms/auth';
import { useQueryClient } from '@tanstack/react-query';
import { profileKeys } from 'src/hooks/useProfileQueries';
import supabase from 'src/supabase';
import type { RiderType } from 'src/types';
import { RESERVED_KEYWORDS, OFFENSIVE_WORDS, USERNAME_REGEX } from 'src/constants/validation';
import { ONBOARDING_STRINGS as s } from 'src/constants/strings';
import { debounce } from 'lodash';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import ErrorIcon from '@mui/icons-material/Error';
import { InputAdornment } from '@mui/material';

export const WelcomeComponent = () => {
    const user = useAtomValue(userAtom);
    const setProfile = useSetAtom(profileAtom);
    const queryClient = useQueryClient();
    const navigate = useNavigate();

    const [step, setStep] = useState(1);
    const [username, setUsername] = useState('');
    const [displayName, setDisplayName] = useState('');
    const [riderType, setRiderType] = useState<RiderType | ''>('');
    const [isValidating, setIsValidating] = useState(false);
    const [usernameError, setUsernameError] = useState<string | null>(null);
    const [isUsernameValid, setIsUsernameValid] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Pre-populate fields from email prefix
    useEffect(() => {
        if (user?.user.email && !username) {
            const prefix = user.user.email.split('@')[0].toLowerCase().replace(/[^a-z0-9_-]/g, '');
            setUsername(prefix);
            if (!displayName) setDisplayName(user.user.email.split('@')[0]);
        }
    }, [user, username, displayName]);

    const performUsernameCheck = async (name: string) => {
        const trimmed = name.trim().toLowerCase();
        if (!trimmed) {
            setUsernameError(null);
            setIsUsernameValid(false);
            setIsValidating(false);
            return;
        }

        if (trimmed.length < 3) {
            setUsernameError(s.ERR_USERNAME_SHORT);
            setIsUsernameValid(false);
            setIsValidating(false);
            return;
        }

        if (trimmed.length > 20) {
            setUsernameError(s.ERR_USERNAME_LONG);
            setIsUsernameValid(false);
            setIsValidating(false);
            return;
        }

        if (!USERNAME_REGEX.test(trimmed)) {
            setUsernameError(s.ERR_USERNAME_CHARS);
            setIsUsernameValid(false);
            setIsValidating(false);
            return;
        }

        if (RESERVED_KEYWORDS.includes(trimmed)) {
            setUsernameError(s.ERR_USERNAME_RESERVED);
            setIsUsernameValid(false);
            setIsValidating(false);
            return;
        }

        const containsOffensive = OFFENSIVE_WORDS.some(word => trimmed.includes(word));
        if (containsOffensive) {
            setUsernameError(s.ERR_USERNAME_OFFENSIVE);
            setIsUsernameValid(false);
            setIsValidating(false);
            return;
        }

        try {
            const { data, error: fetchError } = await supabase
                .from('profiles')
                .select('id')
                .eq('username', trimmed)
                .maybeSingle();

            if (fetchError) {
                setUsernameError('Error checking availability.');
                setIsUsernameValid(false);
            } else if (data && data.id !== user?.user.id) {
                setUsernameError(s.ERR_USERNAME_TAKEN);
                setIsUsernameValid(false);
            } else {
                setUsernameError(null);
                setIsUsernameValid(true);
            }
        } catch (err) {
            setUsernameError('Network error.');
            setIsUsernameValid(false);
        } finally {
            setIsValidating(false);
        }
    };

    const debouncedCheck = useMemo(
        () => debounce(performUsernameCheck, 500),
        [user?.user.id]
    );

    const handleUsernameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value.toLowerCase().replace(/\s/g, '');
        setUsername(value);
        setIsUsernameValid(false);
        setUsernameError(null);
        setIsValidating(true);
        debouncedCheck(value);
    };

    const validateDisplayName = (name: string) => {
        const trimmed = name.trim();
        if (trimmed.length < 2) return s.ERR_NAME_SHORT;
        if (trimmed.length > 50) return s.ERR_NAME_LONG;
        return null;
    };

    const handleNextStep = () => {
        setError(null);
        if (step === 1) {
            if (!isUsernameValid) {
                setError(usernameError || 'Please choose a valid username.');
                return;
            }
            const displayError = validateDisplayName(displayName);
            if (displayError) {
                setError(displayError);
                return;
            }
            if (!riderType) {
                setError(s.ERR_RIDER_TYPE);
                return;
            }
            setStep(2);
        }
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
            setError(s.ERR_RIDER_TYPE);
            return;
        }

        try {
            setIsSubmitting(true);

            // Use upsert to create the profile record if it doesn't exist (e.g. for new users)
            const { data: updatedProfile, error: updateError } = await supabase
                .from('profiles')
                .upsert({
                    id: user.user.id,
                    username: username.trim().toLowerCase(),
                    displayName: displayName.trim(),
                    riderType: riderType,
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
            navigate({ to: '/feed' });
        } catch (err: any) {
            console.error('Onboarding error:', err);
            setError(err.message || s.ERR_SAVE_FAILED);
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <Container maxWidth="sm">
            <Box sx={{ mt: 8, mb: 4 }}>
                <Paper elevation={3} sx={{ p: 4, borderRadius: 2 }}>
                    {step === 1 ? (
                        <>
                            <Typography variant="h4" fontWeight={800} gutterBottom align="center">
                                {s.WELCOME_TITLE}
                            </Typography>
                            <Typography variant="body1" color="text.secondary" align="center" sx={{ mb: 4 }}>
                                {s.WELCOME_SUBTITLE}
                            </Typography>

                            {error && <Alert severity="error" sx={{ mb: 3 }}>{error}</Alert>}

                            <Box component="form" noValidate onSubmit={(e) => e.preventDefault()}>
                                <Stack spacing={3}>
                                    <TextField
                                        required
                                        fullWidth
                                        label={s.STEP1_USERNAME_LABEL}
                                        value={username}
                                        onChange={handleUsernameChange}
                                        error={!!usernameError}
                                        helperText={usernameError || s.STEP1_USERNAME_HELPER}
                                        inputProps={{ maxLength: 20 }}
                                        InputProps={{
                                            endAdornment: (
                                                <InputAdornment position="end">
                                                    {isValidating ? (
                                                        <CircularProgress size={20} />
                                                    ) : isUsernameValid ? (
                                                        <CheckCircleIcon color="success" />
                                                    ) : username.length >= 3 ? (
                                                        <ErrorIcon color="error" />
                                                    ) : null}
                                                </InputAdornment>
                                            ),
                                        }}
                                    />

                                    <TextField
                                        required
                                        fullWidth
                                        label={s.STEP1_DISPLAY_NAME_LABEL}
                                        value={displayName}
                                        onChange={(e) => setDisplayName(e.target.value)}
                                        helperText={s.STEP1_DISPLAY_NAME_HELPER}
                                        inputProps={{ maxLength: 50 }}
                                    />

                                    <FormControl fullWidth required>
                                        <InputLabel id="rider-type-label">{s.STEP1_RIDER_TYPE_LABEL}</InputLabel>
                                        <Select
                                            labelId="rider-type-label"
                                            value={riderType}
                                            label={s.STEP1_RIDER_TYPE_LABEL}
                                            onChange={(e) => setRiderType(e.target.value as RiderType)}
                                        >
                                            <MenuItem value="inline">Inline Skates</MenuItem>
                                            <MenuItem value="skateboard">Skateboard</MenuItem>
                                            <MenuItem value="bmx">BMX</MenuItem>
                                            <MenuItem value="scooter">Scooter</MenuItem>
                                        </Select>
                                    </FormControl>

                                    <Button
                                        fullWidth
                                        variant="contained"
                                        size="large"
                                        onClick={handleNextStep}
                                        disabled={isValidating || !isUsernameValid || !displayName || !riderType}
                                        sx={{ py: 1.5, fontWeight: 'bold' }}
                                    >
                                        {s.STEP1_CONTINUE_BUTTON}
                                    </Button>
                                </Stack>
                            </Box>
                        </>
                    ) : (
                        <Box>
                            <Typography variant="h4" fontWeight={800} gutterBottom align="center">
                                {s.TUTORIAL_TITLE}
                            </Typography>

                            <Stack spacing={4} sx={{ my: 4 }}>
                                <Box>
                                    <Typography variant="subtitle1" fontWeight={900}>{s.TUTORIAL_STEP1_TITLE}</Typography>
                                    <Typography variant="body2" color="text.secondary">
                                        {s.TUTORIAL_STEP1_DESC}
                                    </Typography>
                                </Box>

                                <Box>
                                    <Typography variant="subtitle1" fontWeight={900}>{s.TUTORIAL_STEP2_TITLE}</Typography>
                                    <Typography variant="body2" color="text.secondary">
                                        {s.TUTORIAL_STEP2_DESC}
                                    </Typography>
                                </Box>

                                <Box>
                                    <Typography variant="subtitle1" fontWeight={900}>{s.TUTORIAL_STEP3_TITLE}</Typography>
                                    <Typography variant="body2" color="text.secondary">
                                        {s.TUTORIAL_STEP3_DESC}
                                    </Typography>
                                </Box>
                            </Stack>

                            <Stack direction="row" spacing={2}>
                                <Button
                                    variant="outlined"
                                    fullWidth
                                    onClick={() => setStep(1)}
                                    disabled={isSubmitting}
                                >
                                    {s.BACK_BUTTON}
                                </Button>
                                <Button
                                    variant="contained"
                                    fullWidth
                                    size="large"
                                    onClick={handleSubmit}
                                    disabled={isSubmitting}
                                    sx={{ py: 1.5, fontWeight: 'bold' }}
                                >
                                    {isSubmitting ? <CircularProgress size={24} color="inherit" /> : s.FINISH_BUTTON}
                                </Button>
                            </Stack>
                        </Box>
                    )}
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