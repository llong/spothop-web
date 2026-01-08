import { useCallback, useState } from 'react';
import supabase from 'src/supabase';
import { useAtomValue } from 'jotai';
import { userAtom } from 'src/atoms/auth';
import type { SpotFlagReason } from 'src/types';

export function useFlagging() {
    const user = useAtomValue(userAtom);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const flagSpot = useCallback(async (spotId: string, reason: SpotFlagReason, details?: string) => {
        if (!user?.user.id) {
            setError('You must be logged in to report a spot.');
            return false;
        }

        if (reason === 'other' && (!details || details.trim() === '')) {
            setError('Please provide details for choosing "Other".');
            return false;
        }

        setLoading(true);
        setError(null);

        try {
            const { error: insertError } = await supabase
                .from('content_reports')
                .insert({
                    target_id: spotId,
                    target_type: 'spot',
                    user_id: user.user.id,
                    reason,
                    details: details?.trim() || null
                });

            if (insertError) {
                if (insertError.code === '23505') {
                    setError('You have already reported this spot.');
                } else {
                    setError(insertError.message);
                }
                return false;
            }

            return true;
        } catch (err: any) {
            setError(err.message || 'An unexpected error occurred.');
            return false;
        } finally {
            setLoading(false);
        }
    }, [user]);

    return {
        flagSpot,
        loading,
        error,
        setError
    };
}
