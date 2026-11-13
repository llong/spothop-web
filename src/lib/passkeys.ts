import supabase from '@/supabase';

type Result<T> = { data: T | null; error: { message: string } | null };

const SESSION_EXPIRED = 'Your session has expired. Please sign in again, then add your passkey.';
const UNKNOWN_PASSKEY =
    "That passkey isn't linked to your account anymore. Sign in with your password, then add a new passkey in Settings.";

/**
 * Registers a passkey for the signed-in user.
 *
 * Supabase's one-step registerPasskey() leaves an orphan on the device when the server
 * rejects the credential after the browser has already saved it, and the user then sees
 * a dead passkey in their picker. Here we (1) confirm the session is still valid on the
 * server before touching the device and (2) if the server still rejects the credential,
 * tell the authenticator to forget it (WebAuthn Signal API, where supported).
 */
export async function registerPasskey(): Promise<Result<unknown>> {
    const { error: sessionError } = await supabase.auth.getUser();
    if (sessionError) return { data: null, error: { message: SESSION_EXPIRED } };

    const canRunCeremony =
        typeof window !== 'undefined' &&
        'PublicKeyCredential' in window &&
        typeof PublicKeyCredential.parseCreationOptionsFromJSON === 'function';
    if (!canRunCeremony) return supabase.auth.registerPasskey();

    const { data: start, error: startError } = await supabase.auth.passkey.startRegistration();
    if (startError || !start) return { data: null, error: startError ?? { message: 'Could not start passkey setup.' } };

    let credential: PublicKeyCredential;
    try {
        const options = PublicKeyCredential.parseCreationOptionsFromJSON(start.options as any);
        const created = await navigator.credentials.create({ publicKey: options });
        if (!created) return { data: null, error: { message: 'Passkey setup was cancelled.' } };
        credential = created as PublicKeyCredential;
    } catch (e: any) {
        const cancelled = e?.name === 'NotAllowedError' || e?.name === 'AbortError';
        return { data: null, error: { message: cancelled ? 'Passkey setup was cancelled.' : (e?.message ?? 'Passkey setup failed.') } };
    }

    const result = await supabase.auth.passkey.verifyRegistration({
        challengeId: start.challenge_id,
        credential: credential.toJSON() as any,
    });

    if (result.error) {
        await signalUnknownCredential((start.options as any)?.rp?.id, credential.id);
    }
    return result as Result<unknown>;
}

/** Best-effort: ask the authenticator to delete a credential the server doesn't know about. */
async function signalUnknownCredential(rpId: string | undefined, credentialId: string) {
    try {
        const pkc = (window as any).PublicKeyCredential;
        if (rpId && typeof pkc?.signalUnknownCredential === 'function') {
            await pkc.signalUnknownCredential({ rpId, credentialId });
        }
    } catch {
        // unsupported or rejected: nothing else we can do
    }
}

/** Turns Supabase passkey sign-in errors into something a normal user can act on. */
export function friendlyPasskeySignInError(error: { message: string; code?: string; name?: string }): string {
    if (error.code === 'webauthn_verification_failed' || error.code === 'webauthn_credential_not_found') {
        return UNKNOWN_PASSKEY;
    }
    if (error.name === 'WebAuthnError' && /cancel|abort|not allowed/i.test(error.message)) {
        return 'Passkey sign-in was cancelled.';
    }
    return error.message;
}
