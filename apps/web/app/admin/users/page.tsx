"use client";

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../../lib/supabase';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Icons } from '../../lib/icons';
import { ConfirmDialog } from '../../components/common/ConfirmDialog';
import { useAppStore } from '../../context/AppContext';
import { DynamicIcon } from '../../components/common/DynamicIcon';
import { Discount } from '../../types';
import { fetchDiscountsWithStats, createDiscount, deleteDiscount } from '../../services/discountService';
import { formatDate, formatCurrency } from '../../utils/helpers';
import { DiscountCreationModal } from '../../components/modals/DiscountCreationModal';
import { RedemptionLedgerModal } from '../../components/modals/RedemptionLedgerModal';
import { UserCleanupModal } from '../../components/modals/UserCleanupModal';

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

interface ClientRow {
    user_id: string;
    first_name: string;
    last_name: string;
    email: string;
    username: string;
    image: string;
    color: string;
}

interface ProfileRow {
    id: string;
    role: string;
    created_at: string;
}

export default function AdminUsersPage() {
    const { Shield, Trash2, ChevronRight, Loader2, TrendingUp, TrendingDown, User, Key, Plus, Tag, ExternalLink } = Icons;
    const { showNotification } = useAppStore();
    
    const [users, setUsers] = useState<UserProfile[]>([]);
    const [discounts, setDiscounts] = useState<Discount[]>([]);
    const [loading, setLoading] = useState(true);
    const [viewingLedger, setViewingLedger] = useState<{ id: number; name: string; code: string } | null>(null);
    
    // UI Sections
    const [sections, setSections] = useState({
        admins: true,
        clients: true,
        discounts: false
    });

    const toggleSection = (key: keyof typeof sections) => {
        setSections(prev => {
            const newState = { ...prev, [key]: !prev[key] };
            
            // If expanding Discounts, collapse System Access (admins/clients)
            if (key === 'discounts' && newState.discounts) {
                newState.admins = false;
                newState.clients = false;
            }
            
            // If expanding an Admin or Client table, collapse Discounts
            if ((key === 'admins' || key === 'clients') && newState[key]) {
                newState.discounts = false;
            }
            
            return newState;
        });
    };

    // Token State
    const [showTokenDialog, setShowTokenDialog] = useState(false);
    const [newToken, setNewToken] = useState('');
    const [updatingToken, setUpdatingToken] = useState(false);

    // Discount State
    const [showDiscountDialog, setShowDiscountDialog] = useState(false);
    const [isCreatingDiscount, setIsCreatingDiscount] = useState(false);
    const [discountDeleteTarget, setDiscountDeleteTarget] = useState<Discount | null>(null);
    const [alwaysApproveDiscountDelete, setAlwaysApproveDiscountDelete] = useState(false);

    // Demote Confirmation State
    const [demoteTarget, setDemoteTarget] = useState<UserProfile | null>(null);
    const [alwaysApproveDemote, setAlwaysApproveDemote] = useState(false);

    // Delete User / Cleanup State
    const [cleanupTarget, setCleanupTarget] = useState<UserProfile | null>(null);

    const fetchUsers = useCallback(async () => {
        const { data: profiles, error: profileError } = await supabase
            .from('profiles')
            .select('id, role, created_at');

        if (profileError) {
            console.error('Error fetching profiles', profileError);
            return;
        }

        const { data: clientsData, error: clientError } = await supabase
            .from('clients')
            .select('user_id, first_name, last_name, email, username, image, color');
            
        if (clientError) console.error('Error fetching clients', clientError);

        const typedProfiles = (profiles || []) as ProfileRow[];
        const typedClients = (clientsData || []) as ClientRow[];

        const mappedUsers: UserProfile[] = typedProfiles.map((p) => {
            const client = typedClients.find((c) => c.user_id === p.id);
            return {
                id: p.id,
                email: client?.email || 'N/A',
                role: p.role as 'admin' | 'client',
                clientName: client ? `${client.first_name} ${client.last_name}` : 'Unknown Client',
                clientEmail: client?.email,
                username: client?.username,
                image: client?.image,
                color: client?.color
            };
        });

        setUsers(mappedUsers);
    }, []);

    const fetchDiscounts = useCallback(async () => {
        try {
            const data = await fetchDiscountsWithStats();
            setDiscounts(data);
        } catch (_err) {
            console.error("Failed to fetch discounts", _err);
        }
    }, []);

    const fetchAllData = useCallback(async () => {
        setLoading(true);
        try {
            await Promise.all([fetchUsers(), fetchDiscounts()]);
        } catch {
            showNotification("Failed to refresh data", "error");
        } finally {
            setLoading(false);
        }
    }, [fetchUsers, fetchDiscounts, showNotification]);

    useEffect(() => {
        fetchAllData();
        const channel = supabase
            .channel('admin-access-live')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'profiles' }, () => fetchUsers())
            .on('postgres_changes', { event: '*', schema: 'public', table: 'clients' }, () => fetchUsers())
            .on('postgres_changes', { event: '*', schema: 'public', table: 'discounts' }, () => fetchDiscounts())
            .subscribe();
        return () => { supabase.removeChannel(channel); };
    }, [fetchAllData, fetchUsers, fetchDiscounts]);

    const handleUpdateToken = async () => {
        if (!newToken) return;
        setUpdatingToken(true);
        try {
            const { error } = await supabase.from('settings').upsert({ key: 'signup_token', value: newToken });
            if (error) throw error;
            showNotification("Security token updated successfully");
            setShowTokenDialog(false);
            setNewToken('');
        } catch {
            showNotification("Failed to update token", "error");
        } finally { setUpdatingToken(false); }
    };

    const handleCreateDiscount = async (data: Omit<Discount, 'id'>) => {
        setIsCreatingDiscount(true);
        try {
            await createDiscount(data);
            showNotification(`Promotion "${data.name}" created successfully`, "success");
            setShowDiscountDialog(false);
            fetchDiscounts();
        } catch (e) {
            const err = e as { code?: string; message?: string };
            if (err.code === '23505') showNotification(`A discount with code "${data.code}" already exists`, "error");
            else showNotification("Failed to create discount. Please check all fields.", "error");
        } finally { setIsCreatingDiscount(false); }
    };

    const executeDeleteDiscount = async (id: number) => {
        try {
            await deleteDiscount(id);
            showNotification("Discount deleted successfully", "success");
            fetchDiscounts();
        } catch { showNotification("Failed to delete discount", "error"); }
    };

    const executeRoleUpdate = async (userId: string, newRole: string) => {
        const { error } = await supabase.from('profiles').update({ role: newRole }).eq('id', userId);
        if (!error) {
            showNotification(`User role updated to ${newRole}`);
            fetchUsers();
        } else showNotification("Failed to update role", "error");
    };

    // User Table Component
    const UserTable = ({ data, title, isOpen, onToggle, countColor, shadowColor }: { data: UserProfile[], title: string, isOpen: boolean, onToggle: () => void, countColor: string, shadowColor: string }) => (
        <Card noPadding className="mb-8 transition-all duration-300 border-border font-sans font-normal">
            <div className="p-4 border-b border-border bg-background/50 flex justify-between items-center cursor-pointer select-none hover:bg-surface transition-colors" onClick={onToggle}>
                <h3 className="text-theme-subtitle text-foreground flex items-center gap-2">
                    {title} 
                    <span className={`flex items-center justify-center min-w-[24px] h-6 px-2 rounded-full text-white dark:text-background text-theme-subtitle shadow-lg font-normal ${countColor} ${shadowColor}`}>
                        {data.length}
                    </span>
                </h3>
                <ChevronRight className={`w-5 h-5 transition-all duration-200 ${isOpen ? 'rotate-90 text-primary dark:text-warning' : 'text-muted'}`} />
            </div>
            {isOpen && (data.length === 0 ? <div className="p-8 text-center text-muted text-theme-body">No users found.</div> : (
                <div className="overflow-x-auto custom-scrollbar font-sans">
                    <table className="w-full text-left border-collapse animate-in fade-in slide-in-from-top-2 duration-200 min-w-[800px]">
                        <thead><tr className="border-b border-border text-theme-caption font-bold text-muted uppercase tracking-wider"><th className="p-4 pl-6">User / Email</th><th className="p-4">Username</th><th className="p-4 text-center">Role</th><th className="p-4 text-right">Access Level</th><th className="p-4 text-right pr-6">Action</th></tr></thead>
                        <tbody className="divide-y divide-border">{data.map(user => (
                            <tr key={user.id} className="hover:bg-background/40 transition-colors">
                                <td className="p-4 pl-6"><div className="flex items-center gap-3"><div className={`w-7 h-7 rounded-lg flex items-center justify-center border transition-all ${user.color ? user.color.replace('text-', 'bg-').replace('600', '100').replace('500', '100') + ' border-' + (user.color.split('-')[1] || 'slate') + '-200 dark:bg-primary/10 dark:border-primary/20' : 'bg-background border-border'}`}><DynamicIcon iconString={user.image} color={user.color} className="w-3.5 h-3.5" fallback={<User className={`w-3.5 h-3.5 ${user.color || 'text-muted'}`} />} /></div><div><div className="text-theme-title text-foreground leading-tight font-normal">{user.clientName}</div><div className="text-theme-caption text-muted">{user.clientEmail}</div></div></div></td>
                                <td className="p-4 text-theme-label font-mono text-muted">{user.username}</td>
                                <td className="p-4 text-center"><span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] uppercase tracking-tight border ${user.role === 'admin' ? 'bg-status-settlement-bg text-status-settlement border-status-settlement/20' : 'bg-status-completed-bg text-status-completed border-status-completed/20'}`}>{user.role === 'admin' ? <Shield className="w-2.5 h-2.5" /> : <User className="w-2.5 h-2.5" />}{user.role}</span></td>
                                <td className="p-4"><div className="flex justify-end">{user.role === 'client' ? (<button onClick={() => executeRoleUpdate(user.id, 'admin')} className="flex items-center gap-1.5 px-3 py-1.5 bg-status-active-bg text-status-active border border-status-active/20 rounded-xl text-theme-caption font-semibold uppercase tracking-tight hover:bg-status-active/20 transition-all shadow-sm group/btn"><TrendingUp className="w-3.5 h-3.5 group-hover:scale-110 transition-transform" />Promote</button>) : (<button onClick={() => { if (alwaysApproveDemote) executeRoleUpdate(user.id, 'client'); else setDemoteTarget(user); }} className="flex items-center gap-1.5 px-3 py-1.5 bg-status-rejected-bg text-status-rejected border border-status-rejected/20 rounded-xl text-theme-caption font-semibold uppercase tracking-tight hover:bg-status-rejected/20 transition-all shadow-sm group/btn"><TrendingDown className="w-3.5 h-3.5 group-hover:scale-110 transition-transform" />Demote</button>)}</div></td>
                                <td className="p-4 pr-6">
                                    <div className="flex justify-end">
                                        <button 
                                            onClick={() => setCleanupTarget(user)}
                                            className="p-2 bg-error text-white dark:text-background hover:opacity-90 rounded-xl transition-all shadow-lg shadow-error/20 active:scale-90"
                                            title="Revoke Access"
                                        >
                                            <Trash2 className="w-4.5 h-4.5" />
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        ))}</tbody>
                    </table>
                </div>
            ))}
        </Card>
    );

    // Discount Table Component
    const DiscountTable = () => (
        <Card noPadding className="mb-8 transition-all duration-300 border-border font-sans font-normal">
            <div className="p-4 border-b border-border bg-background/50 flex justify-between items-center cursor-pointer select-none hover:bg-surface transition-colors" onClick={() => toggleSection('discounts')}>
                <h3 className="text-theme-subtitle text-foreground flex items-center gap-2">
                    <Tag className="w-5 h-5 text-secondary" /> Discounts
                    <span className="flex items-center justify-center min-w-[24px] h-6 px-2 rounded-full bg-secondary text-white dark:text-background text-theme-subtitle shadow-lg shadow-secondary/20 font-normal">{discounts.length}</span>
                </h3>
                <div className="flex items-center gap-4">
                    <Button size="sm" className="bg-secondary text-white dark:text-background hover:opacity-90 shadow-lg shadow-secondary/20 uppercase text-theme-body font-semibold font-sans" onClick={(e) => { e.stopPropagation(); setShowDiscountDialog(true); } }>
                        <Plus className="w-3.5 h-3.5 mr-1.5" /> Create New
                    </Button>
                    <ChevronRight className={`w-5 h-5 transition-all duration-200 ${sections.discounts ? 'rotate-90 text-secondary dark:text-warning' : 'text-muted'}`} />
                </div>
            </div>
            {sections.discounts && (discounts.length === 0 ? <div className="p-8 text-center text-muted text-theme-body font-sans font-normal">No discounts found.</div> : (
                <div className="overflow-x-auto custom-scrollbar font-sans font-normal">
                    <table className="w-full text-left border-collapse min-w-[1000px]">
                        <thead>
                            <tr className="border-b border-border text-theme-caption text-muted uppercase">
                                <th className="p-4 pl-6 text-center w-20">Approval</th>
                                <th className="p-4">Promotion</th>
                                <th className="p-4 text-center">Status</th>
                                <th className="p-4 text-center">Usage</th>
                                <th className="p-4 text-right">Value</th>
                                <th className="p-4 text-center">Period</th>
                                <th className="p-4 pr-6 text-right w-20">Action</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-border">
                            {discounts.map(discount => {
                                const todayStr = new Date().toISOString().split('T')[0] ?? '';
                                let status: 'active' | 'expired' | 'upcoming' = 'active';
                                
                                if (discount.duration_type === 'period' && discount.end_date && todayStr > discount.end_date) status = 'expired';
                                else if (discount.duration_type === 'period' && discount.start_date && todayStr < discount.start_date) status = 'upcoming';

                                return (
                                    <tr key={discount.id} className="hover:bg-background/40 transition-colors group font-sans font-normal">
                                        <td className="p-4 pl-6 text-center">
                                            <div 
                                                title={discount.approval_strategy === 'auto' ? 'Automatic Approval' : 'Manual Admin Approval'}
                                                className={`w-8 h-8 rounded-full mx-auto flex items-center justify-center text-theme-subtitle shadow-md transition-transform group-hover:scale-110 font-normal text-white dark:text-background ${
                                                    discount.approval_strategy === 'auto' 
                                                    ? 'bg-success' 
                                                    : 'bg-accent-primary'
                                                }`}
                                            >
                                                {discount.approval_strategy === 'auto' ? 'A' : 'M'}
                                            </div>
                                        </td>
                                        <td className="p-4">
                                            <div className="flex flex-col">
                                                <span className="text-theme-title text-foreground leading-tight font-normal">{discount.name}</span>
                                                <span className="font-mono text-theme-body text-secondary uppercase">{discount.code}</span>
                                            </div>
                                        </td>
                                        <td className="p-4 text-center">
                                            <span className={`px-2.5 py-1 rounded-full text-theme-subtitle uppercase shadow-sm font-normal text-white dark:text-background ${
                                                status === 'active' ? 'bg-success' :
                                                status === 'expired' ? 'bg-error' :
                                                'bg-warning'
                                            }`}>
                                                {status}
                                            </span>
                                        </td>
                                        <td className="p-4 text-center">
                                            <div 
                                                className={`flex flex-col items-center cursor-pointer group/usage p-2 rounded-xl transition-all ${discount.usageCount ? 'hover:bg-primary/5' : ''}`}
                                                onClick={() => discount.usageCount ? setViewingLedger({ id: discount.id, name: discount.name, code: discount.code }) : null}
                                                title={discount.usageCount ? "View Redemption Ledger" : "No usage yet"}
                                            >
                                                <div className="flex items-center gap-1.5">
                                                    <span className={`text-theme-title font-normal ${discount.usageCount ? 'text-primary group-hover/usage:underline' : 'text-foreground'}`}>
                                                        {discount.usageCount || 0}
                                                    </span>
                                                    {!!discount.usageCount && <ExternalLink className="w-3 h-3 text-primary opacity-0 group-hover/usage:opacity-100 transition-opacity" />}
                                                </div>
                                                <span className="text-theme-body text-muted uppercase opacity-60 font-normal">
                                                    {discount.duration_type === 'one_time' ? 'One-Time' : discount.duration_type === 'unlimited' ? 'Unlimited' : 'Period'}
                                                </span>
                                            </div>
                                        </td>
                                        <td className="p-4 text-right">
                                            <span className={`px-3 py-1 rounded-xl text-theme-label font-semibold uppercase text-white dark:text-background shadow-md shadow-secondary/10 ${discount.discount_type === 'percentage' ? 'bg-secondary dark:bg-status-settlement' : 'bg-status-active'}`}>
                                                {discount.discount_type === 'percentage' ? `${discount.discount_value}%` : formatCurrency(discount.discount_value)}
                                            </span>
                                        </td>
                                        <td className="p-4 text-center">
                                            <span className="text-theme-subtitle text-muted font-normal">
                                                {discount.duration_type === 'period' 
                                                    ? `${formatDate(discount.start_date)} - ${formatDate(discount.end_date)}` 
                                                    : 'N/A'}
                                            </span>
                                        </td>
                                        <td className="p-4 pr-6">
                                            <div className="flex justify-end">
                                                <button 
                                                    onClick={() => {
                                                        if (alwaysApproveDiscountDelete) {
                                                            executeDeleteDiscount(discount.id);
                                                        } else {
                                                            setDiscountDeleteTarget(discount);
                                                        }
                                                    }}
                                                    className="p-2 bg-error text-white dark:text-background hover:opacity-90 rounded-xl transition-all shadow-lg shadow-error/20 active:scale-90"
                                                    title="Delete Discount"
                                                >
                                                    <Trash2 className="w-4.5 h-4.5" />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            ))}
        </Card>
    );

    const admins = users.filter(u => u.role === 'admin');
    const clientsData = users.filter(u => u.role === 'client');

    return (
        <div className="animate-in fade-in duration-500 space-y-12 font-sans">
            {/* SECTION 1: SYSTEM ACCESS */}
            <div className="space-y-6">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        <div className="flex items-center gap-2 text-muted text-theme-caption font-semibold uppercase tracking-widest mb-1">
                            <span>Management</span><ChevronRight className="w-3 h-3" /><span className="text-primary">Access</span>
                        </div>
                        <h1 className="text-theme-header text-foreground tracking-tight">System Access</h1>
                    </div>
                    <div className="flex items-center gap-2">
                        <button onClick={() => setShowTokenDialog(true)} className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-surface border border-border text-muted hover:text-primary hover:border-primary/30 transition-all font-semibold text-theme-caption uppercase tracking-wide shadow-sm font-sans">
                            <Key className="w-3 h-3" />Change Access Token
                        </button>
                        {/* INVERTED BUTTON: Background takes text color, text takes background color */}
                        <Button 
                            onClick={() => fetchAllData()} 
                            size="sm" 
                            className="bg-foreground text-background border-none hover:opacity-90 font-sans"
                        >
                            Refresh List
                        </Button>
                    </div>
                </div>

                {loading ? (
                    <div className="p-12 text-center text-muted bg-surface rounded-2xl shadow-sm border border-border font-sans"><Loader2 className="w-8 h-8 mx-auto mb-4 animate-spin opacity-20" /><p className="text-theme-body font-medium">Loading Access Data...</p></div>
                ) : (
                    <>
                        <UserTable 
                            data={admins} 
                            title="Admin Team" 
                            isOpen={sections.admins} 
                            onToggle={() => toggleSection('admins')} 
                            countColor="bg-primary"
                            shadowColor="shadow-primary/20"
                        />
                        <UserTable 
                            data={clientsData} 
                            title="Client Accounts" 
                            isOpen={sections.clients} 
                            onToggle={() => toggleSection('clients')} 
                            countColor="bg-primary"
                            shadowColor="shadow-primary/20"
                        />
                    </>
                )}
            </div>

            {/* SECTION 2: DISCOUNTS MANAGER */}
            <div className="space-y-6">
                <div>
                    <div className="flex items-center gap-2 text-muted text-theme-caption font-semibold uppercase tracking-widest mb-1">
                        <span>Management</span><ChevronRight className="w-3 h-3" /><span className="text-secondary">Promotion</span>
                    </div>
                    <h1 className="text-theme-header text-foreground tracking-tight">Discounts Manager</h1>
                </div>
                
                {!loading && <DiscountTable />}
            </div>

            <DiscountCreationModal 
                isOpen={showDiscountDialog}
                onClose={() => setShowDiscountDialog(false)}
                onSave={handleCreateDiscount}
                isSaving={isCreatingDiscount}
            />

            {/* TOKEN UPDATE DIALOG */}
            {showTokenDialog && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 font-sans">
                    <Card className="w-full max-w-md p-6 md:p-8 animate-in zoom-in-95 duration-200">
                        <div className="flex items-center gap-3 mb-6">
                            <div className="p-3 rounded-2xl bg-primary/10 text-primary"><Shield className="w-6 h-6" /></div>
                            <div><h3 className="text-theme-title font-bold text-foreground">Update Security Token</h3><p className="text-theme-caption text-muted">Required for new user signup</p></div>
                        </div>
                        <div className="space-y-4">
                            <div className="space-y-1.5"><label className="text-theme-caption font-semibold text-muted uppercase tracking-widest ml-1">New Token</label><input type="text" className="w-full p-4 bg-background border-2 border-border rounded-2xl outline-none focus:border-primary text-foreground text-theme-label font-medium tracking-[0.3em] text-center placeholder:tracking-normal placeholder:font-normal font-sans" placeholder="Enter security token" value={newToken} onChange={(e) => setNewToken(e.target.value)} /></div>
                            <div className="flex gap-3 pt-2"><Button variant="secondary" className="flex-1 font-sans" onClick={() => setShowTokenDialog(false)}>Cancel</Button><Button className="flex-1 bg-primary text-primary-text font-black uppercase tracking-widest text-[10px] rounded-xl font-sans" onClick={handleUpdateToken} disabled={updatingToken}>{updatingToken ? 'Updating...' : 'Save Token'}</Button></div>
                        </div>
                    </Card>
                </div>
            )}

            <ConfirmDialog 
                isOpen={!!demoteTarget} 
                title="Confirm Demotion" 
                message={`Are you sure you want to demote ${demoteTarget?.clientName} to a standard client? They will lose access to all admin features immediately.`} 
                confirmText="Demote User" 
                confirmVariant="danger" 
                showAlwaysDeleteOption={true} 
                onConfirm={(always) => { if (always) setAlwaysApproveDemote(true); if (demoteTarget) executeRoleUpdate(demoteTarget.id, 'client'); setDemoteTarget(null); }} 
                onCancel={() => setDemoteTarget(null)} 
            />

            {cleanupTarget && (
                <UserCleanupModal 
                    isOpen={!!cleanupTarget}
                    onClose={() => setCleanupTarget(null)}
                    userId={cleanupTarget.id}
                    clientName={cleanupTarget.clientName || 'Unknown'}
                    clientEmail={cleanupTarget.email}
                    onSuccess={fetchUsers}
                    showNotification={showNotification}
                />
            )}

            <ConfirmDialog 
                isOpen={!!discountDeleteTarget} 
                title="Delete Discount?" 
                message={`Are you sure you want to delete ${discountDeleteTarget?.name}? This will invalidate the code immediately.`} 
                confirmText="Yes, Delete" 
                confirmVariant="danger" 
                showAlwaysDeleteOption={true}
                onConfirm={(always) => { 
                    if (always) setAlwaysApproveDiscountDelete(true); 
                    if (discountDeleteTarget) executeDeleteDiscount(discountDeleteTarget.id); 
                    setDiscountDeleteTarget(null); 
                }} 
                onCancel={() => setDiscountDeleteTarget(null)} 
            />

            {viewingLedger && (
                <RedemptionLedgerModal 
                    isOpen={!!viewingLedger}
                    onClose={() => setViewingLedger(null)}
                    discountId={viewingLedger.id}
                    discountName={viewingLedger.name}
                    discountCode={viewingLedger.code}
                />
            )}
        </div>
    );
}