/**
 * Utility for checking content safety using Sightengine.
 * 
 * Sightengine API docs: https://sightengine.com/docs
 */

export interface ModerationResult {
    safe: boolean;
    reason?: string;
    details?: any;
}

import supabase from 'src/supabase';

// Real implementation using Supabase Edge Function
const checkContentReal = async (file: File): Promise<ModerationResult> => {
    try {
        const formData = new FormData();
        formData.append('media', file);

        const { data, error } = await supabase.functions.invoke('moderate-content', {
            body: formData,
        });

        if (error) {
            // If the function doesn't exist (e.g. not running locally or not deployed yet), 
            // log a warning but allow the upload to proceed for better DX.
            console.warn('Moderation function unavailable, skipping check:', error);
            return { safe: true };
        }

        if (!data || data.status !== 'success') {
            console.error('Sightengine API error:', data);
            // Fail open or closed? Failing open for MVP to avoid blocking valid users on API error, 
            // but logging it.
            return { safe: true }; 
        }

        // 1. Check Nudity
        if (data.nudity) {
            // "safe" is the confidence that the image is safe.
            // We focus on "raw" (explicit/genitals) nudity to avoid false positives for shirtless skaters.
            // "partial" often flags swimwear/shirtless men, which is acceptable in this context.
            // We only block explicit nudity.
            if (data.nudity.raw >= 0.5) {
                return { safe: false, reason: 'Nudity detected', details: data.nudity };
            }
        }

        // 2. Check WAD (Weapons, Alcohol, Drugs)
        if (data.weapon > 0.5) return { safe: false, reason: 'Weapon detected', details: { weapon: data.weapon } };
        // We might allow alcohol/drugs for a skate app (skate culture?), but let's block heavy drugs.
        // data.drugs > 0.5 -> Block? Let's stick to "extreme violence" and "pornography" per spec.
        // "illicit material" could imply drugs.
        if (data.drugs > 0.5) return { safe: false, reason: 'Illicit substances detected', details: { drugs: data.drugs } };

        // 3. Check Gore/Violence
        if (data.gore) {
             if (data.gore.prob > 0.5) return { safe: false, reason: 'Extreme violence/gore detected', details: data.gore };
        }

        // 4. Check Offensive
        if (data.offensive) {
            if (data.offensive.prob > 0.5) return { safe: false, reason: 'Offensive content detected', details: data.offensive };
        }

        return { safe: true, details: data };

    } catch (error) {
        console.error('Moderation check failed:', error);
        // Fail open if service is down to not block users
        return { safe: true };
    }
};

export const checkContent = async (file: File): Promise<ModerationResult> => {
    return checkContentReal(file);
};
