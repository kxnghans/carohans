"use client";

import { ReactNode } from 'react';
import { Icons, InventoryIcons, AccountIcons } from '../../lib/icons';

interface DynamicIconProps {
  iconString: string | null | undefined;
  fallback?: ReactNode;
  className?: string;
  color?: string;
  variant?: 'table' | 'modal' | 'large' | 'profile' | 'form';
  forceUpdate?: unknown; // To trigger re-render on state change
}

/**
 * Handles rendering of both standard system icons and dynamic inventory icons.
 * Expects format "icon:IconName" for inventory/account icons or standard strings for fallback.
 */
export const DynamicIcon = ({ 
  iconString, 
  fallback, 
  className = "", 
  color, 
  variant = 'table',
  forceUpdate 
}: DynamicIconProps) => {
  // Centralized sizing properties
  const variantMap = {
    table: { container: 'w-8 h-8', icon: '!w-[87.5%] !h-[87.5%]', emoji: 'text-[1.75em]' },
    modal: { container: 'w-12 h-12', icon: '!w-[87.5%] !h-[87.5%]', emoji: 'text-[2.6em]' },
    large: { container: 'w-16 h-16', icon: '!w-[87.5%] !h-[87.5%]', emoji: 'text-[3.5em]' },
    profile: { container: 'w-14 h-14', icon: '!w-[87.5%] !h-[87.5%]', emoji: 'text-[3.0em]' },
    form: { container: 'w-10 h-10', icon: '!w-[87.5%] !h-[87.5%]', emoji: 'text-[2.15em]' }
  };

  const v = variantMap[variant];
  const finalContainerClass = `${v.container} ${className}`;
  
  // Create a unique key to force re-render when record data changes
  const renderKey = forceUpdate ? (typeof forceUpdate === 'object' && forceUpdate !== null ? `${(forceUpdate as Record<string, unknown>).id}-${(forceUpdate as Record<string, unknown>).image}-${(forceUpdate as Record<string, unknown>).color}` : String(forceUpdate)) : undefined;

  if (!iconString) return <div key={renderKey} className={`flex items-center justify-center ${finalContainerClass}`}>{fallback || '📦'}</div>;

  const renderIcon = (Icon: React.ComponentType<{ className?: string }>) => (
    <div key={renderKey} className={`flex items-center justify-center shrink-0 ${finalContainerClass}`}>
      <Icon className={`shrink-0 ${v.icon} ${color || ''}`} />
    </div>
  );

  if (iconString.startsWith('icon:')) {
    const iconKey = iconString.replace('icon:', '');
    const IconComp = InventoryIcons[iconKey] || AccountIcons[iconKey] || (Icons as Record<string, React.ComponentType<{ className?: string }>>)[iconKey];

    if (IconComp) return renderIcon(IconComp);
    return <div key={renderKey} className={`flex items-center justify-center ${finalContainerClass}`}>{fallback || '📦'}</div>;
  }

  // Handle case where it might be a system icon name without "icon:" prefix
  const SystemIcon = (Icons as Record<string, React.ComponentType<{ className?: string }>>)[iconString];
  if (SystemIcon) return renderIcon(SystemIcon);

  // Handle standard icons or emoji strings
  return (
    <div key={renderKey} className={`flex items-center justify-center shrink-0 ${finalContainerClass} ${color || ''}`}>
      <span className={`leading-none ${v.emoji} block transform translate-y-[0.05em]`}>{iconString || fallback || '📦'}</span>
    </div>
  );
};
