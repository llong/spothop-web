/**
 * Content safety checks using Sightengine (through the `moderate-content` Edge Function).
 * Docs: https://sightengine.com/docs
 *
 * Send a small image (e.g. an 800px thumbnail): the scan does not need full-resolution files and
 * the upload time dominates the cost.
 */
import supabase from '@/supabase';

export interface ModerationResult {
    safe: boolean;
    reason?: string;
    details?: unknown;
}

/** Fail open: an unavailable or erroring moderation service must not block legitimate uploads. */
const SAFE: ModerationResult = { safe: true };

export const checkContent = async (media: Blob): Promise<ModerationResult> => {
    try {
        const formData = new FormData();
        formData.append('media', media, 'media.webp');

        const { data, error } = await supabase.functions.invoke('moderate-content', { body: formData });
        if (error) {
            console.warn('Moderation function unavailable, skipping check:', error);
            return SAFE;
        }
        if (!data || data.status !== 'success') {
            console.error('Sightengine API error:', data);
            return SAFE;
        }

        // Only explicit nudity is blocked ("partial" flags shirtless skaters and swimwear).
        if (data.nudity?.raw >= 0.5) return { safe: false, reason: 'Nudity detected', details: data.nudity };
        if (data.weapon > 0.5) return { safe: false, reason: 'Weapon detected', details: { weapon: data.weapon } };
        if (data.drugs > 0.5) return { safe: false, reason: 'Illicit substances detected', details: { drugs: data.drugs } };
        if (data.gore?.prob > 0.5) return { safe: false, reason: 'Extreme violence/gore detected', details: data.gore };
        if (data.offensive?.prob > 0.5) return { safe: false, reason: 'Offensive content detected', details: data.offensive };

        return { safe: true, details: data };
    } catch (error) {
        console.error('Moderation check failed:', error);
        return SAFE;
    }
};
