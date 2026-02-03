"use client";

import { ReactNode } from 'react';
import { Icons, InventoryIcons } from '../../lib/icons';

interface DynamicIconProps {
  iconString: string | null | undefined;
  fallback?: ReactNode;
  className?: string;
  color?: string;
}

/**
 * Handles rendering of both standard system icons and dynamic inventory icons.
 * Expects format "icon:IconName" for inventory icons or standard strings for fallback.
 */
export const DynamicIcon = ({ iconString, fallback, className = "w-5 h-5 lg:w-6 lg:h-6", color }: DynamicIconProps) => {
  if (!iconString) return <>{fallback}</>;

  if (iconString.startsWith('icon:')) {
    const iconKey = iconString.replace('icon:', '');
    
    // 1. Try InventoryIcons first
    let IconComp = InventoryIcons[iconKey];
    
    // 2. Try System Icons next
    if (!IconComp) {
      IconComp = (Icons as Record<string, React.ComponentType<{ className?: string }>>)[iconKey];
    }

    if (IconComp) {
      return <IconComp className={`${className} ${color || ''}`} />;
    }

    // If icon: format was used but not found, use fallback
    return <>{fallback}</>;
  }

  // Handle case where it might be a system icon name without "icon:" prefix
  const SystemIcon = (Icons as Record<string, React.ComponentType<{ className?: string }>>)[iconString];
  if (SystemIcon) {
    return <SystemIcon className={`${className} ${color || ''}`} />;
  }

  // Handle standard icons or emoji strings
  return <div className={className}>{iconString || fallback || '📦'}</div>;
};
