/** Helpers for errors returned by `supabase.functions.invoke`. */

/** Extracts the HTTP status and the server's message from a supabase-js Functions error. */
export async function readFunctionError(error: unknown): Promise<{ status?: number; message: string }> {
    const response = (error as { context?: Response }).context;
    const fallback = (error as { message?: string }).message ?? '';
    if (!response || typeof response.json !== 'function') return { message: fallback };
    try {
        const body = await response.clone().json();
        return { status: response.status, message: body?.error ?? body?.message ?? fallback };
    } catch {
        return { status: response.status, message: fallback };
    }
}

/** Supabase answers 404 "Requested function was not found" when an Edge Function is not deployed. */
export function isFunctionNotDeployed(status: number | undefined, message: string): boolean {
    return status === 404 && /function was not found/i.test(message);
}
