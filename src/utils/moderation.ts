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

// Real implementation using Sightengine
const checkContentReal = async (file: File): Promise<ModerationResult> => {
    // Check if keys are available
    const apiUser = import.meta.env.VITE_SIGHTENGINE_USER;
    const apiSecret = import.meta.env.VITE_SIGHTENGINE_SECRET;

    if (!apiUser || !apiSecret) {
        console.warn('Sightengine API keys missing. Skipping moderation.');
        return { safe: true };
    }

    try {
        const formData = new FormData();
        formData.append('media', file);
        // Models: nudity, weapons, alcohol, drugs, offensive, scam, gore
        // 'nudity-2.0' is the newer model, but 'nudity' is standard. Let's use standard set.
        formData.append('models', 'nudity,wad,offensive,scam,gore');
        formData.append('api_user', apiUser);
        formData.append('api_secret', apiSecret);

        const response = await fetch('https://api.sightengine.com/1.0/check.json', {
            method: 'POST',
            body: formData
        });

        const data = await response.json();

        if (data.status !== 'success') {
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
