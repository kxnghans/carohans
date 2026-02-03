'use server';

import { createAdminClient } from '../lib/supabase-admin';
import { createClient } from '../lib/supabase-server';

export interface AdminUserListResult {
    id: string;
    email: string;
    role: 'admin' | 'client';
    clientName: string;
    clientEmail?: string;
    username?: string;
    image?: string;
    color?: string;
}

export async function getAdminUsersList(): Promise<AdminUserListResult[]> {
    const supabase = await createClient();
    
    // 1. Verify Authentication & Admin Role
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
        throw new Error('Unauthorized');
    }

    const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single();

    if (profile?.role !== 'admin') {
        throw new Error('Forbidden: Admin access required');
    }

    // 2. Initialize Admin Client to fetch sensitive data (emails from auth.users)
    const adminClient = createAdminClient();

    // 3. Fetch Data in Parallel
    const [
        { data: { users: authUsers }, error: authUsersError },
        { data: profiles, error: profilesError },
        { data: clients, error: clientsError }
    ] = await Promise.all([
        adminClient.auth.admin.listUsers({ perPage: 1000 }), // Adjust limit as needed
        adminClient.from('profiles').select('id, role, created_at'),
        adminClient.from('clients').select('user_id, first_name, last_name, email, username, image, color')
    ]);

    if (authUsersError) throw new Error(`Failed to fetch auth users: ${authUsersError.message}`);
    if (profilesError) throw new Error(`Failed to fetch profiles: ${profilesError.message}`);
    if (clientsError) throw new Error(`Failed to fetch clients: ${clientsError.message}`);

    // 4. Merge Data (Profiles + Offline Clients)
    
    // Part A: Users with Profiles (Admins & Registered Clients)
    const linkedUsers: AdminUserListResult[] = (profiles || []).map((p) => {
        const authUser = authUsers?.find(u => u.id === p.id);
        const client = clients?.find(c => c.user_id === p.id);

        // Priority for Email: Client Record > Auth User Record > Placeholder
        const email = client?.email || authUser?.email || 'N/A';
        
        // Priority for Name: Client Record > Auth Metadata > "System Admin"
        let clientName = 'Unknown User';
        if (client) {
            clientName = `${client.first_name} ${client.last_name}`;
        } else if (p.role === 'admin') {
             // Try to get name from auth metadata if available
             const meta = authUser?.user_metadata;
             if (meta?.first_name || meta?.last_name) {
                 clientName = `${meta.first_name || ''} ${meta.last_name || ''}`.trim();
             } else {
                 clientName = 'System Admin';
             }
        }

        return {
            id: p.id,
            email: email,
            role: p.role as 'admin' | 'client',
            clientName: clientName,
            clientEmail: client?.email,
            username: client?.username || authUser?.user_metadata?.username,
            image: client?.image,
            color: client?.color
        };
    });

    // Part B: Offline Clients (Clients in DB but no Auth Profile/User ID)
    // We filter clients who do not have a corresponding ID in the 'profiles' list we just processed
    const profileIds = new Set((profiles || []).map(p => p.id));
    const offlineClients: AdminUserListResult[] = (clients || [])
        .filter(c => !c.user_id || !profileIds.has(c.user_id))
        .map(c => ({
            id: `offline-${c.user_id || 'no-id'}-${Math.random().toString(36).substr(2, 9)}`, // Generate a temporary safe ID for UI key
            email: c.email || 'No Email',
            role: 'client', // Always a client
            clientName: `${c.first_name} ${c.last_name}`,
            clientEmail: c.email,
            username: c.username,
            image: c.image,
            color: c.color
        }));

    // Return Combined List
    return [...linkedUsers, ...offlineClients];
}

export async function updateUserRole(userId: string, newRole: 'admin' | 'client'): Promise<{ success: boolean; error?: string }> {
    const supabase = await createClient();
    
    // 1. Verify Authentication & Admin Role
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) throw new Error('Unauthorized');

    // Prevent self-demotion to avoid locking oneself out of management
    if (user.id === userId && newRole === 'client') {
        return { success: false, error: 'Cannot demote yourself. Please ask another admin.' };
    }

    const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single();
    if (profile?.role !== 'admin') throw new Error('Forbidden: Admin access required');

    // 2. Execute Update via Admin Client
    const adminClient = createAdminClient();
    
    try {
        // A. Update public.profiles table
        const { error: profileError } = await adminClient
            .from('profiles')
            .update({ role: newRole })
            .eq('id', userId);

        if (profileError) throw profileError;

        // B. Update Auth Metadata (Ensures next session/JWT is updated)
        const { error: authError } = await adminClient.auth.admin.updateUserById(userId, {
            user_metadata: { role: newRole }
        });

        if (authError) throw authError;

        // C. Ensure Client Record exists if demoting to client
        if (newRole === 'client') {
            const { data: existingClient } = await adminClient
                .from('clients')
                .select('id')
                .eq('user_id', userId)
                .maybeSingle();

            if (!existingClient) {
                // Fetch profile data to populate the new client record
                const { data: profile } = await adminClient
                    .from('profiles')
                    .select('*')
                    .eq('id', userId)
                    .single();

                if (profile) {
                    await adminClient.from('clients').insert({
                        user_id: userId,
                        first_name: profile.first_name || '',
                        last_name: profile.last_name || '',
                        email: profile.email,
                        username: profile.username,
                        phone: profile.phone || '',
                        total_orders: 0,
                        total_spent: 0,
                        image: 'icon:User',
                        color: 'text-primary'
                    });
                }
            }
        }

        return { success: true };
    } catch (e: unknown) {
        const message = e instanceof Error ? e.message : 'Failed to update user role';
        return { success: false, error: message };
    }
}

export async function deleteUser(userId: string, selectedOrderIds: number[], mode: 'full' | 'unlink'): Promise<{ success: boolean; error?: string }> {
    const supabase = await createClient();
    
    // 1. Verify Authentication & Admin Role
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) throw new Error('Unauthorized');

    const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single();
    if (profile?.role !== 'admin') throw new Error('Forbidden: Admin access required');

    // 2. Execute Cleanup via Admin Client
    const adminClient = createAdminClient();
    
    try {
        if (mode === 'full') {
            if (selectedOrderIds.length > 0) {
                // 1. Delete items first (FK constraint)
                const { error: itemsError } = await adminClient
                    .from('order_items')
                    .delete()
                    .in('order_id', selectedOrderIds);
                
                if (itemsError) throw new Error(`Failed to delete order items: ${itemsError.message}`);

                // 2. Delete orders
                const { error: ordersError } = await adminClient
                    .from('orders')
                    .delete()
                    .in('id', selectedOrderIds);

                if (ordersError) throw new Error(`Failed to delete orders: ${ordersError.message}`);
            }

            // Note: We keep the client record but it is now "Offline" (user_id is null)
            // If the user wanted to delete the client record itself, we would add that here.
            // But based on the strategy, we preserve historical context.
        }

        // 3. Unlink client record (Preserves data but removes portal connection)
        const { error: unlinkError } = await adminClient
            .from('clients')
            .update({ user_id: null })
            .eq('user_id', userId);
        
        if (unlinkError) throw new Error(`Failed to unlink client: ${unlinkError.message}`);

        // 4. Delete Auth Profile (public.profiles)
        const { error: profileError } = await adminClient
            .from('profiles')
            .delete()
            .eq('id', userId);
        
        if (profileError) throw new Error(`Failed to delete profile: ${profileError.message}`);

        // 5. Delete Auth User from Supabase Auth
        const { error: authDeleteError } = await adminClient.auth.admin.deleteUser(userId);
        if (authDeleteError) {
            // If the user doesn't exist in Auth (already deleted or never existed), we can ignore this error
            if (!authDeleteError.message.includes('User not found')) {
                throw new Error(`Failed to delete auth user: ${authDeleteError.message}`);
            }
        }

        return { success: true };
    } catch (e: unknown) {
        const message = e instanceof Error ? e.message : 'Unknown error during cleanup';
        return { success: false, error: message };
    }
}
