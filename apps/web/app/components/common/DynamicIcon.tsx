"use client";

import { ReactNode } from 'react';
import { InventoryIcons } from '../../lib/icons';

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
    const IconComp = InventoryIcons[iconKey];
    if (IconComp) {
      return <IconComp className={`${className} ${color || ''}`} />;
    }
  }

  // Handle standard icons or emoji strings
  return <div className={className}>{iconString || fallback || '📦'}</div>;
};
