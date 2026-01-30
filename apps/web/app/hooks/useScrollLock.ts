import { useEffect } from 'react';

/**
 * useScrollLock
 * Locks the scroll of the body and documentElement when isOpen is true.
 * This prevents background scrolling when a modal is open.
 */
export const useScrollLock = (isOpen: boolean) => {
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      document.documentElement.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
      document.documentElement.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
      document.documentElement.style.overflow = 'unset';
    };
  }, [isOpen]);
};
