import { createFileRoute, redirect } from '@tanstack/react-router';
import {
    Container,
    Box,
    Paper,
} from '@mui/material';
import supabase from 'src/supabase';
import { useOnboarding } from './hooks/useOnboarding';
import { OnboardingStep1 } from './-components/OnboardingStep1';
import { OnboardingStep2 } from './-components/OnboardingStep2';

export const WelcomeComponent = () => {
    const { state, handleUsernameChange, handleNextStep, handleSubmit } = useOnboarding();

    return (
        <Container maxWidth="sm">
            <Box sx={{ mt: 8, mb: 4 }}>
                <Paper elevation={3} sx={{ p: 4, borderRadius: 2 }}>
                    {state.step === 1 ? (
                        <OnboardingStep1
                            username={state.username}
                            onUsernameChange={handleUsernameChange}
                            usernameError={state.usernameError}
                            isValidating={state.isValidating}
                            isUsernameValid={state.isUsernameValid}
                            displayName={state.displayName}
                            onDisplayNameChange={state.setDisplayName}
                            riderType={state.riderType}
                            onRiderTypeChange={state.setRiderType}
                            onNext={handleNextStep}
                            error={state.error}
                        />
                    ) : (
                        <OnboardingStep2
                            onBack={() => state.setStep(1)}
                            onSubmit={handleSubmit}
                            isSubmitting={state.isSubmitting}
                        />
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
