'use server';

import { createAdminClient } from '../lib/supabase-admin';
import { cookies } from 'next/headers';

export interface ClientAuthResponse {
    success: boolean;
    error?: string;
    clientId?: number;
}

export async function authenticateClient(firstName: string, lastName: string, phone: string): Promise<ClientAuthResponse> {
    try {
        const supabase = createAdminClient();
        
        const { data, error } = await supabase
            .from('clients')
            .select('id')
            .ilike('first_name', firstName.trim())
            .ilike('last_name', lastName.trim())
            .eq('phone', phone.trim())
            .single();

        if (error || !data) {
            return { success: false, error: 'Client record not found. Please check your details or sign up.' };
        }

        // Set a session cookie for the client portal
        const cookieStore = await cookies();
        cookieStore.set('client_session', data.id.toString(), {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
            maxAge: 60 * 60 * 24 * 7, // 1 week
            path: '/',
        });

        return { success: true, clientId: data.id };
    } catch (err) {
        console.error('Auth error:', err);
        return { success: false, error: 'An unexpected error occurred.' };
    }
}

export async function logoutClient() {
    const cookieStore = await cookies();
    cookieStore.delete('client_session');
}

export async function getClientSession(): Promise<number | null> {
    const cookieStore = await cookies();
    const sessionId = cookieStore.get('client_session')?.value;
    return sessionId ? parseInt(sessionId, 10) : null;
}
