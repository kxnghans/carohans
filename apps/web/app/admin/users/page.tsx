"use client";

import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Icons } from '../../lib/icons';
import { ConfirmDialog } from '../../components/common/ConfirmDialog';

interface UserProfile {
    id: string;
    email: string;
    role: 'admin' | 'client';
    clientName?: string;
    clientEmail?: string;
    username?: string;
    image?: string;
    color?: string;
}

import { useAppStore } from '../../context/AppContext';
import { InventoryIcons } from '../../lib/icons';
import { DynamicIcon } from '../../components/common/DynamicIcon';

export default function AdminUsersPage() {
    const { Shield, Trash2, ChevronRight, Loader2, TrendingUp, TrendingDown, User } = Icons;
    const { showNotification } = useAppStore();
    const [users, setUsers] = useState<UserProfile[]>([]);
    const [loading, setLoading] = useState(true);
    
    // Collapsible State
    const [sections, setSections] = useState({
        admins: true,
        clients: true
    });

    const toggleSection = (key: keyof typeof sections) => {
        setSections(prev => ({ ...prev, [key]: !prev[key] }));
    };
    
    // Demote Confirmation State
    const [demoteTarget, setDemoteTarget] = useState<UserProfile | null>(null);
    const [alwaysApproveDemote, setAlwaysApproveDemote] = useState(false);

    // Delete Confirmation State
    const [deleteTarget, setDeleteTarget] = useState<UserProfile | null>(null);
    const [alwaysApproveDelete, setAlwaysApproveDelete] = useState(false);

    const fetchUsers = async (silent = false) => {
        if (!silent) setLoading(true);
        const { data: profiles, error: profileError } = await supabase
            .from('profiles')
            .select('id, role, created_at');

        if (profileError) {
            console.error('Error fetching profiles', profileError);
            setLoading(false);
            return;
        }

        const { data: clients, error: clientError } = await supabase
            .from('clients')
            .select('user_id, name, email, username, image, color');
            
        if (clientError) {
            console.error('Error fetching clients', clientError);
        }

        const merged: UserProfile[] = profiles
            .map((p: any) => {
                const client = clients?.find((c: any) => c.user_id === p.id);
                return {
                    id: p.id,
                    email: client?.email || 'No Email',
                    role: p.role as 'admin' | 'client',
                    clientName: client?.name || null,
                    clientEmail: client?.email || null,
                    username: client?.username || '-',
                    image: client?.image || '',
                    color: client?.color || ''
                };
            })
            // Only show users who have a linked client record or an email
            // This filters out stale/incomplete auth profiles
            .filter((u: any) => u.clientName !== null || u.clientEmail !== null) as UserProfile[];

        setUsers(merged);
        setLoading(false);
    };

    useEffect(() => {
        fetchUsers();

        // Subscribe to changes for real-time updates from Supabase
        const channel = supabase
            .channel('admin-users-live')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'profiles' }, () => fetchUsers(true))
            .on('postgres_changes', { event: '*', schema: 'public', table: 'clients' }, () => fetchUsers(true))
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, []);

    const executeRoleUpdate = async (userId: string, newRole: string) => {
        const { error } = await supabase
            .from('profiles')
            .update({ role: newRole })
            .eq('id', userId);

        if (!error) {
            showNotification(`User role updated to ${newRole}`);
            fetchUsers(true);
        } else {
            showNotification("Failed to update role", "error");
        }
    };

    const handleActionClick = (user: UserProfile) => {
        if (user.role === 'client') {
            executeRoleUpdate(user.id, 'admin');
        } else {
            if (alwaysApproveDemote) {
                executeRoleUpdate(user.id, 'client');
            } else {
                setDemoteTarget(user);
            }
        }
    };

    const handleConfirmDemote = (always: boolean = false) => {
        if (!demoteTarget) return;
        if (always) setAlwaysApproveDemote(true);
        executeRoleUpdate(demoteTarget.id, 'client');
        setDemoteTarget(null);
    };

    const deleteUser = async (userId: string) => {
        try {
            // 1. Unlink client record (set user_id to null) instead of deleting
            // This preserves order history while removing login access
            const { error: unlinkError } = await supabase.from('clients').update({ user_id: null }).eq('user_id', userId);
            if (unlinkError) console.error("Unlink error:", unlinkError);
            
            // 2. Delete from profiles
            const { error: profileError } = await supabase.from('profiles').delete().eq('id', userId);

            if (profileError) throw profileError;

            showNotification("Access deleted successfully");
            // Immediately clear from local state for speed
            setUsers(prev => prev.filter(u => u.id !== userId));
            // Sync with server
            fetchUsers(true);
        } catch (error: any) {
            console.error("Delete failed", error);
            showNotification("Failed to delete access. This can happen if the user has active records.", "error");
        }
    };

    const handleConfirmDelete = async (always: boolean = false) => {
        if (!deleteTarget) return;
        if (always) setAlwaysApproveDelete(true);
        await deleteUser(deleteTarget.id);
        setDeleteTarget(null);
    };

    const admins = users.filter(u => u.role === 'admin');
    const clients = users.filter(u => u.role === 'client');

    const UserTable = ({ 
        data, 
        title, 
        isOpen, 
        onToggle 
    }: { 
        data: UserProfile[], 
        title: string, 
        isOpen: boolean, 
        onToggle: () => void 
    }) => (
        <Card noPadding className="mb-8 transition-all duration-300 border-border">
            <div 
                className="p-4 border-b border-border bg-background/50 flex justify-between items-center cursor-pointer select-none hover:bg-surface transition-colors"
                onClick={onToggle}
            >
                <h3 className="text-theme-subtitle font-bold text-foreground flex items-center gap-2">
                    {title} 
                    <span className="text-theme-caption bg-background dark:bg-slate-800 text-muted px-2 py-0.5 rounded-full border border-border">{data.length}</span>
                </h3>
                <ChevronRight className={`w-5 h-5 transition-all duration-200 ${isOpen ? 'rotate-90 text-primary dark:text-amber-500' : 'text-muted'}`} />
            </div>
            
            {isOpen && (
                data.length === 0 ? (
                     <div className="p-8 text-center text-muted text-theme-body">No users found.</div>
                ) : (
                <div className="overflow-x-auto custom-scrollbar">
                    <table className="w-full text-left border-collapse animate-in fade-in slide-in-from-top-2 duration-200 min-w-[800px]">
                        <thead>
                            <tr className="border-b border-border text-theme-caption font-bold text-muted uppercase tracking-wider">
                                <th className="p-4 pl-6">User / Email</th>
                                <th className="p-4">Username</th>
                                <th className="p-4 text-center">Role</th>
                                <th className="p-4 text-right">Access Level</th>
                                <th className="p-4 text-right pr-6">Action</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-border">
                            {data.map(user => {
                                return (
                                <tr key={user.id} className="hover:bg-background/50 transition-colors">
                                    <td className="p-4 pl-6">
                                        <div className="flex items-center gap-3">
                                            <div className={`w-8 h-8 rounded-lg flex items-center justify-center border transition-all ${user.color ? user.color.replace('text-', 'bg-').replace('600', '100').replace('500', '100') + ' border-' + (user.color.split('-')[1] || 'slate') + '-200 dark:bg-primary/10 dark:border-primary/20' : 'bg-background border-border'}`}>
                                                <DynamicIcon iconString={user.image} color={user.color} className="w-4 h-4" fallback={<User className={`w-4 h-4 ${user.color || 'text-muted'}`} />} />
                                            </div>
                                            <div>
                                                <div className="text-theme-label font-bold text-foreground leading-tight">{user.clientName}</div>
                                                <div className="text-theme-caption text-muted">{user.clientEmail}</div>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="p-4 text-theme-label font-mono text-muted">
                                        {user.username}
                                    </td>
                                    <td className="p-4 text-center">
                                        <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] uppercase tracking-tight ${
                                            user.role === 'admin' 
                                            ? 'bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400' 
                                            : 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400'
                                        }`}>
                                            {user.role === 'admin' ? <Shield className="w-3 h-3" /> : <User className="w-3 h-3" />}
                                            {user.role}
                                        </span>
                                    </td>
                                    <td className="p-4">
                                        <div className="flex justify-end">
                                            {user.role === 'client' ? (
                                                <button 
                                                    onClick={() => handleActionClick(user)}
                                                    className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-800 rounded-xl text-theme-caption font-black uppercase tracking-tight hover:bg-blue-100 dark:hover:bg-blue-900/50 transition-all shadow-sm group/btn"
                                                >
                                                    <TrendingUp className="w-3.5 h-3.5 group-hover:scale-110 transition-transform" />
                                                    Promote
                                                </button>
                                            ) : (
                                                <button 
                                                    onClick={() => handleActionClick(user)}
                                                    className="flex items-center gap-1.5 px-3 py-1.5 bg-rose-50 dark:bg-rose-900/30 text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-800 rounded-xl text-theme-caption font-black uppercase tracking-tight hover:bg-rose-100 dark:hover:bg-rose-900/50 transition-all shadow-sm group/btn"
                                                >
                                                    <TrendingDown className="w-3.5 h-3.5 group-hover:scale-110 transition-transform" />
                                                    Demote
                                                </button>
                                            )}
                                        </div>
                                    </td>
                                    <td className="p-4 pr-6">
                                        <div className="flex justify-end">
                                            <Button 
                                                size="sm" 
                                                variant="danger" 
                                                onClick={() => {
                                                    if (alwaysApproveDelete) {
                                                        deleteUser(user.id);
                                                    } else {
                                                        setDeleteTarget(user);
                                                    }
                                                }}
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </Button>
                                        </div>
                                    </td>
                                </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
                )
            )}
        </Card>
    );

    return (
        <div className="animate-in fade-in duration-500 space-y-6">
             <div className="flex justify-between items-center">
                <div>
                    <div className="flex items-center gap-2 text-muted text-theme-caption font-black uppercase tracking-widest mb-1">
                        <span>Management</span>
                        <ChevronRight className="w-3 h-3" />
                        <span className="text-primary">Access</span>
                    </div>
                    <h2 className="text-theme-title text-foreground tracking-tight">System Access</h2>
                </div>
                <Button onClick={() => fetchUsers()} variant="secondary" size="sm">Refresh List</Button>
            </div>

            {loading ? (
                <div className="p-12 text-center text-muted bg-surface rounded-2xl shadow-sm border border-border">
                    <Loader2 className="w-8 h-8 mx-auto mb-4 animate-spin opacity-20" />
                    <p className="text-theme-body font-medium">Loading Access Data...</p>
                </div>
            ) : (
                <>
                    <UserTable 
                        data={admins} 
                        title="Admin Team" 
                        isOpen={sections.admins} 
                        onToggle={() => toggleSection('admins')} 
                    />
                    <UserTable 
                        data={clients} 
                        title="Client Accounts" 
                        isOpen={sections.clients} 
                        onToggle={() => toggleSection('clients')} 
                    />
                </>
            )}

            <ConfirmDialog
                isOpen={!!demoteTarget}
                title="Confirm Demotion"
                message={`Are you sure you want to demote ${demoteTarget?.clientName} to a standard client? They will lose access to all admin features immediately.`}
                confirmText="Demote User"
                confirmVariant="danger"
                showAlwaysDeleteOption={true}
                onConfirm={handleConfirmDemote}
                onCancel={() => setDemoteTarget(null)}
            />

            <ConfirmDialog
                isOpen={!!deleteTarget}
                title="Delete Account"
                message={`Are you sure you want to delete ${deleteTarget?.clientName}'s access? This will remove their profile and client record. This action cannot be undone.`}
                confirmText="Delete Access"
                confirmVariant="danger"
                showAlwaysDeleteOption={true}
                onConfirm={handleConfirmDelete}
                onCancel={() => setDeleteTarget(null)}
            />
        </div>
    );
}