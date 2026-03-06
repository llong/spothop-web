import { useState, useEffect, useMemo, useCallback } from 'react';
import { useNavigate } from '@tanstack/react-router';
import { useAtomValue, useSetAtom } from 'jotai';
import { userAtom, profileAtom } from 'src/atoms/auth';
import { useQueryClient } from '@tanstack/react-query';
import { profileKeys } from 'src/hooks/useProfileQueries';
import supabase from 'src/supabase';
import type { RiderType } from 'src/types';
import { RESERVED_KEYWORDS, OFFENSIVE_WORDS, USERNAME_REGEX } from 'src/constants/validation';
import { ONBOARDING_STRINGS as s } from 'src/constants/strings';
import { debounce } from 'lodash';

export function useOnboarding() {
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

    useEffect(() => {
        if (user?.user.email && !username) {
            const prefix = user.user.email.split('@')[0].toLowerCase().replace(/[^a-z0-9_-]/g, '');
            setUsername(prefix);
            if (!displayName) setDisplayName(user.user.email.split('@')[0]);
        }
    }, [user, username, displayName]);

    const performUsernameCheck = useCallback(async (name: string) => {
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
    }, [user?.user.id]);

    const debouncedCheck = useMemo(
        () => debounce(performUsernameCheck, 500),
        [performUsernameCheck]
    );

    const handleUsernameChange = (value: string) => {
        const lowerValue = value.toLowerCase().replace(/\s/g, '');
        setUsername(lowerValue);
        setIsUsernameValid(false);
        setUsernameError(null);
        setIsValidating(true);
        debouncedCheck(lowerValue);
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
                setProfile(updatedProfile as any);
                await queryClient.invalidateQueries({
                    queryKey: profileKeys.detail(user.user.id)
                });
            }
            navigate({ to: '/feed' });
        } catch (err: any) {
            console.error('Onboarding error:', err);
            setError(err.message || s.ERR_SAVE_FAILED);
        } finally {
            setIsSubmitting(false);
        }
    };

    return {
        state: {
            step, setStep,
            username,
            displayName, setDisplayName,
            riderType, setRiderType,
            isValidating,
            usernameError,
            isUsernameValid,
            isSubmitting,
            error, setError
        },
        handleUsernameChange,
        handleNextStep,
        handleSubmit
    };
}
