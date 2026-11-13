import { describe, it, expect, vi, beforeEach } from 'vitest';

const mocks = vi.hoisted(() => ({
    getUser: vi.fn(),
    registerPasskey: vi.fn(),
}));
vi.mock('@/supabase', () => ({
    default: { auth: { getUser: mocks.getUser, registerPasskey: mocks.registerPasskey, passkey: {} } },
}));

import { registerPasskey, friendlyPasskeySignInError } from './passkeys';

describe('registerPasskey', () => {
    beforeEach(() => vi.clearAllMocks());

    it('refuses before touching the device when the session is gone', async () => {
        mocks.getUser.mockResolvedValue({ data: { user: null }, error: { message: 'session_not_found' } });
        const result = await registerPasskey();
        expect(result.error?.message).toMatch(/sign in again/i);
        expect(mocks.registerPasskey).not.toHaveBeenCalled();
    });

    it('falls back to supabase registerPasskey when the browser lacks the JSON helpers', async () => {
        mocks.getUser.mockResolvedValue({ data: { user: {} }, error: null });
        mocks.registerPasskey.mockResolvedValue({ data: { id: '1' }, error: null });
        const result = await registerPasskey();
        expect(mocks.registerPasskey).toHaveBeenCalled();
        expect(result.error).toBeNull();
    });
});

describe('friendlyPasskeySignInError', () => {
    it('explains an unknown credential in plain language', () => {
        const msg = friendlyPasskeySignInError({ message: 'Credential verification failed', code: 'webauthn_verification_failed' });
        expect(msg).toMatch(/isn't linked/i);
    });

    it('passes other messages through', () => {
        expect(friendlyPasskeySignInError({ message: 'Email not confirmed' })).toBe('Email not confirmed');
    });
});
