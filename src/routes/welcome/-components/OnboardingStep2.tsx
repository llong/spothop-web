import {
    Typography,
    Stack,
    Box,
    Button,
    CircularProgress,
} from '@mui/material';
import { ONBOARDING_STRINGS as s } from 'src/constants/strings';

interface OnboardingStep2Props {
    onBack: () => void;
    onSubmit: (e: React.FormEvent) => void;
    isSubmitting: boolean;
}

export function OnboardingStep2({
    onBack,
    onSubmit,
    isSubmitting,
}: OnboardingStep2Props) {
    return (
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
                    onClick={onBack}
                    disabled={isSubmitting}
                >
                    {s.BACK_BUTTON}
                </Button>
                <Button
                    variant="contained"
                    fullWidth
                    size="large"
                    onClick={onSubmit}
                    disabled={isSubmitting}
                    sx={{ py: 1.5, fontWeight: 'bold' }}
                >
                    {isSubmitting ? <CircularProgress size={24} color="inherit" /> : s.FINISH_BUTTON}
                </Button>
            </Stack>
        </Box>
    );
}
