'use server';

import { createAdminClient } from '../lib/supabase-admin';

/**
 * Resolves an email address from a login input (email or username).
 * This is performed on the server via the service_role client to prevent
 * username enumeration by unauthenticated users on the client side.
 */
export async function resolveUserEmail(loginInput: string): Promise<{ email: string | null; error?: string }> {
    if (!loginInput) return { email: null };

    const isEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(loginInput);
    if (isEmail) return { email: loginInput };

    try {
        const adminClient = createAdminClient();
        
        // Call the RPC that is now restricted to service_role/authenticated
        const { data: resolvedEmail, error: rpcError } = await adminClient
            .rpc('get_email_for_login', { login_input: loginInput.toLowerCase() });

        if (rpcError) {
            console.error('Error resolving email:', rpcError);
            return { email: null, error: 'Failed to resolve identity.' };
        }

        return { email: resolvedEmail || null };
    } catch (err) {
        console.error('Unexpected error in resolveUserEmail:', err);
        return { email: null, error: 'Internal server error.' };
    }
}
