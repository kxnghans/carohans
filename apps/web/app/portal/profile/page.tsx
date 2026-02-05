"use client";

import { useAppStore } from '../../context/AppContext';
import { Card } from '../../components/ui/Card';
import { ClientProfileForm } from '../../components/clients/ClientProfileForm';
import { PortalFormData } from '../../types';

export default function PortalProfilePage() {
  const { portalFormData, setPortalFormData, updateProfile, loading } = useAppStore();

  const handleUpdate = async (data: PortalFormData) => {
    // Update local state and trigger context update
    setPortalFormData(data);
    await updateProfile(data);
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-3 text-muted">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
        <p className="text-theme-body font-medium">Loading profile...</p>
      </div>
    );
  }

  return (
    <div className="max-w-xl mx-auto animate-in fade-in duration-500">
      <Card className="p-8">
        <ClientProfileForm 
            initialData={portalFormData} 
            onSubmit={handleUpdate} 
        />
      </Card>
    </div>
  );
}
