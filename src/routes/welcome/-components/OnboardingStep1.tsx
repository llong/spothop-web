import {
    Typography,
    Stack,
    Box,
    TextField,
    InputAdornment,
    CircularProgress,
    FormControl,
    InputLabel,
    Select,
    MenuItem,
    Button,
    Alert,
} from '@mui/material';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import ErrorIcon from '@mui/icons-material/Error';
import { ONBOARDING_STRINGS as s } from 'src/constants/strings';
import type { RiderType } from 'src/types';

interface OnboardingStep1Props {
    username: string;
    onUsernameChange: (val: string) => void;
    usernameError: string | null;
    isValidating: boolean;
    isUsernameValid: boolean;
    displayName: string;
    onDisplayNameChange: (val: string) => void;
    riderType: RiderType | '';
    onRiderTypeChange: (val: RiderType) => void;
    onNext: () => void;
    error: string | null;
}

export function OnboardingStep1({
    username,
    onUsernameChange,
    usernameError,
    isValidating,
    isUsernameValid,
    displayName,
    onDisplayNameChange,
    riderType,
    onRiderTypeChange,
    onNext,
    error,
}: OnboardingStep1Props) {
    return (
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
                        onChange={(e) => onUsernameChange(e.target.value)}
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
                        onChange={(e) => onDisplayNameChange(e.target.value)}
                        helperText={s.STEP1_DISPLAY_NAME_HELPER}
                        inputProps={{ maxLength: 50 }}
                    />

                    <FormControl fullWidth required>
                        <InputLabel id="rider-type-label">{s.STEP1_RIDER_TYPE_LABEL}</InputLabel>
                        <Select
                            labelId="rider-type-label"
                            value={riderType}
                            label={s.STEP1_RIDER_TYPE_LABEL}
                            onChange={(e) => onRiderTypeChange(e.target.value as RiderType)}
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
                        onClick={onNext}
                        disabled={isValidating || !isUsernameValid || !displayName || !riderType}
                        sx={{ py: 1.5, fontWeight: 'bold' }}
                    >
                        {s.STEP1_CONTINUE_BUTTON}
                    </Button>
                </Stack>
            </Box>
        </>
    );
}
