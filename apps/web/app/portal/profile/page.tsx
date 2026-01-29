"use client";

import { useAppStore } from '../../context/AppContext';
import { Card } from '../../components/ui/Card';
import { ClientProfileForm } from '../../components/clients/ClientProfileForm';
import { PortalFormData } from '../../types';

export default function PortalProfilePage() {
  const { portalFormData, setPortalFormData, updateProfile } = useAppStore();

  const handleUpdate = async (data: PortalFormData) => {
    // Update local state and trigger context update
    setPortalFormData(data);
    await updateProfile(data);
  };

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
