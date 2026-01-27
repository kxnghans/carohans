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
}

import { useAppStore } from '../../context/AppContext';

export default function AdminUsersPage() {
    const { Shield, Trash2, ChevronRight, Loader2 } = Icons;
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
            .select('user_id, name, email, username');
            
        if (clientError) {
            console.error('Error fetching clients', clientError);
        }

        const merged: UserProfile[] = profiles
            .map(p => {
                const client = clients?.find(c => c.user_id === p.id);
                return {
                    id: p.id,
                    email: client?.email || 'No Email',
                    role: p.role as 'admin' | 'client',
                    clientName: client?.name || null,
                    clientEmail: client?.email || null,
                    username: client?.username || '-'
                };
            })
            // Only show users who have a linked client record or an email
            // This filters out stale/incomplete auth profiles
            .filter(u => u.clientName !== null || u.clientEmail !== null) as UserProfile[];

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
        <Card noPadding className="mb-8 transition-all duration-300">
            <div 
                className="p-4 border-b border-slate-100 bg-slate-50/50 flex justify-between items-center cursor-pointer select-none hover:bg-slate-100/50 transition-colors"
                onClick={onToggle}
            >
                <h3 className="font-bold text-slate-800 flex items-center gap-2">
                    {title} 
                    <span className="text-xs bg-slate-200 text-slate-600 px-2 py-0.5 rounded-full">{data.length}</span>
                </h3>
                <ChevronRight className={`w-5 h-5 text-slate-400 transition-transform duration-200 ${isOpen ? 'rotate-90' : ''}`} />
            </div>
            
            {isOpen && (
                data.length === 0 ? (
                     <div className="p-8 text-center text-slate-500 text-sm">No users found.</div>
                ) : (
                <table className="w-full text-left border-collapse animate-in fade-in slide-in-from-top-2 duration-200">
                    <thead>
                        <tr className="border-b border-slate-100">
                            <th className="p-4 pl-6 text-xs font-bold text-slate-500 uppercase">User / Email</th>
                            <th className="p-4 text-xs font-bold text-slate-500 uppercase">Username</th>
                            <th className="p-4 text-xs font-bold text-slate-500 uppercase text-center">Role</th>
                            <th className="p-4 text-xs font-bold text-slate-500 uppercase text-right">Access Level</th>
                            <th className="p-4 text-xs font-bold text-slate-500 uppercase text-right pr-6">Action</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                        {data.map(user => (
                            <tr key={user.id} className="hover:bg-slate-50/50 transition-colors">
                                <td className="p-4 pl-6">
                                    <div className="font-bold text-slate-900">{user.clientName}</div>
                                    <div className="text-xs text-slate-500">{user.clientEmail}</div>
                                </td>
                                <td className="p-4 text-sm font-mono text-slate-600">
                                    {user.username}
                                </td>
                                <td className="p-4 text-center">
                                    <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold capitalize ${
                                        user.role === 'admin' 
                                        ? 'bg-purple-100 text-purple-700' 
                                        : 'bg-emerald-100 text-emerald-700'
                                    }`}>
                                        {user.role === 'admin' && <Shield className="w-3 h-3" />}
                                        {user.role}
                                    </span>
                                </td>
                                <td className="p-4">
                                    <div className="flex justify-end">
                                        {user.role === 'client' ? (
                                            <Button size="sm" onClick={() => handleActionClick(user)}>
                                                Promote
                                            </Button>
                                        ) : (
                                            <Button size="sm" variant="secondary" onClick={() => handleActionClick(user)}>
                                                Demote
                                            </Button>
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
                        ))}
                    </tbody>
                </table>
                )
            )}
        </Card>
    );

    return (
        <div className="animate-in fade-in duration-500 space-y-6">
             <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold">Access</h2>
                <Button onClick={() => fetchUsers()} variant="secondary">Refresh List</Button>
            </div>

            {loading ? (
                <div className="p-12 text-center text-slate-500 bg-white rounded-2xl shadow-sm border border-slate-200">
                    <Loader2 className="w-8 h-8 mx-auto mb-4 animate-spin opacity-20" />
                    <p className="text-sm font-medium">Loading Access Data...</p>
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